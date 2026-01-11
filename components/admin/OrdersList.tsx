'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { format } from 'date-fns'
import tr from 'date-fns/locale/tr'
import { Printer, CreditCard, X } from 'lucide-react'

type Order = Database['public']['Tables']['orders']['Row'] & {
  tables: Database['public']['Tables']['tables']['Row']
  users: Database['public']['Tables']['users']['Row']
  order_items: (Database['public']['Tables']['order_items']['Row'] & {
    products: Database['public']['Tables']['products']['Row']
  })[]
}

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'open' | 'sent' | 'paid'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [restaurantCode, setRestaurantCode] = useState<string>('')
  const [restaurantIban, setRestaurantIban] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'credit_card' | 'iban' | null>(null)
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptContent, setReceiptContent] = useState<string>('')
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])

  const openPaymentModal = (orderId: string) => {
    setPaymentOrderId(orderId)
    setSelectedPaymentMethod(null)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!supabase || !paymentOrderId || !selectedPaymentMethod) return

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: selectedPaymentMethod,
      })
      .eq('id', paymentOrderId)

    if (error) {
      console.error('Error marking order as paid:', error)
      alert('Ödeme işaretlenirken hata: ' + error.message)
      return
    }

    alert('Sipariş ödendi olarak işaretlendi!')
    setShowPaymentModal(false)
    setPaymentOrderId(null)
    setSelectedPaymentMethod(null)
    await loadOrders()
    setSelectedOrder(null)
  }

  useEffect(() => {
    if (!supabase) return
    loadRestaurantCode()
    loadOrders()
  }, [filter, supabase])

  const loadRestaurantCode = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.restaurant_id) {
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('code, iban')
        .eq('id', userProfile.restaurant_id)
        .single()

      if (restaurant) {
        setRestaurantCode(restaurant.code)
        setRestaurantIban(restaurant.iban || null)
      }
    }
  }

  const loadOrders = async () => {
    // Get user's restaurant_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.restaurant_id) {
      setLoading(false)
      return
    }

    // Get table IDs for this restaurant
    const { data: restaurantTables } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', userProfile.restaurant_id)

    if (!restaurantTables || restaurantTables.length === 0) {
      setOrders([])
      setLoading(false)
      return
    }

    const tableIds = restaurantTables.map(t => t.id)

    let query = supabase
      .from('orders')
      .select(
        `
        *,
        tables (*),
        users (*),
        order_items (
          *,
          products (*)
        )
      `
      )
      .in('table_id', tableIds)
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data } = await query

    if (data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }


  const showReceiptPreview = (order: Order) => {
    try {
      if (!order || !order.tables || !order.order_items) {
        alert('Sipariş bilgileri eksik!')
        return
      }

      const orderDate = format(
        new Date(order.created_at), 
        'dd.MM.yyyy HH:mm',
        tr ? { locale: tr } : undefined
      )

      const paymentMethodText = order.payment_method 
        ? order.payment_method === 'cash' ? 'Nakit' :
          order.payment_method === 'credit_card' ? 'Kredi Kartı' :
          'IBAN'
        : ''

      const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Adisyon - Masa ${order.tables.table_number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: Arial, sans-serif; 
              padding: 10px; 
              font-size: 12px;
              margin: 0;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .restaurant-name { font-size: 16px; font-weight: bold; margin-bottom: 5px; }
            .info { margin-bottom: 10px; }
            .items { margin: 10px 0; }
            .item { margin: 5px 0; }
            .total { 
              border-top: 1px solid #000; 
              padding-top: 10px; 
              margin-top: 10px;
              font-weight: bold;
              font-size: 14px;
            }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${restaurantCode || 'ADİSYON'}</div>
          </div>
          <div class="info">
            <div><strong>Masa:</strong> ${order.tables.table_number}</div>
            <div><strong>Garson:</strong> ${order.users?.name || 'Bilinmiyor'}</div>
            <div><strong>Tarih:</strong> ${orderDate}</div>
            <div><strong>Sipariş No:</strong> #${order.order_number || 'N/A'}</div>
          </div>
          <div class="items">
            <div style="font-weight: bold; margin-bottom: 5px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">ÜRÜNLER</div>
            ${(order.order_items || [])
              .map(
                (item) => `
              <div class="item">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <span>${item.quantity}x ${item.products?.name || 'Ürün'}</span>
                    ${item.note ? `<div style="font-size: 10px; color: #6366f1; font-style: italic; margin-top: 2px;">📝 ${item.note}</div>` : ''}
                  </div>
                  <span>${(item.quantity * item.price).toFixed(2)} ₺</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
          <div class="total">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>TOPLAM:</strong></span>
              <span><strong>${order.total_price?.toFixed(2) || '0.00'} ₺</strong></span>
            </div>
            ${paymentMethodText ? `
              <div style="margin-top: 5px; font-size: 11px;">
                <strong>Ödeme:</strong> ${paymentMethodText}
              </div>
            ` : ''}
          </div>
          <div class="footer">
            Teşekkür ederiz!
          </div>
        </body>
      </html>
    `

      setReceiptContent(content)
      setShowReceiptModal(true)
    } catch (error) {
      console.error('Adisyon oluşturma hatası:', error)
      alert('Adisyon oluşturulurken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'))
    }
  }

  const printReceipt = () => {
    if (!receiptContent) return

    try {
      // Use iframe method to avoid pop-up blocker
      const blob = new Blob([receiptContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      
      // Create a hidden iframe instead of a new window
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.src = url
      
      document.body.appendChild(iframe)
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            const iframeWindow = iframe.contentWindow
            if (iframeWindow) {
              iframeWindow.focus()
              iframeWindow.print()
            }
          } catch (e) {
            console.error('Print hatası:', e)
            // Fallback: try to open in new window as last resort
            const printWindow = window.open(url, '_blank', 'width=400,height=600')
            if (printWindow) {
              printWindow.onload = () => {
                setTimeout(() => printWindow.print(), 250)
              }
            }
          }
          
          // Clean up iframe after print dialog closes
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            URL.revokeObjectURL(url)
          }, 1000)
        }, 250)
      }

      // Fallback: Clean up after 10 seconds if onload doesn't fire
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe)
        }
        URL.revokeObjectURL(url)
      }, 10000)
    } catch (error) {
      console.error('Adisyon yazdırma hatası:', error)
      alert('Adisyon yazdırılamadı. Lütfen tarayıcı ayarlarınızı kontrol edin.')
    }
  }

  const getDailyTotal = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return orders
      .filter(
        (order) =>
          order.status === 'paid' &&
          new Date(order.created_at) >= today
      )
      .reduce((sum, order) => sum + Number(order.total_price), 0)
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded ${
            filter === 'open' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Açık
        </button>
        <button
          onClick={() => setFilter('sent')}
          className={`px-4 py-2 rounded ${
            filter === 'sent' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Gönderildi
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded ${
            filter === 'paid' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Ödendi
        </button>
      </div>

      {/* Daily Total */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="text-sm text-green-700">Günlük Toplam Ciro</div>
        <div className="text-2xl font-bold text-green-900">
          {getDailyTotal().toFixed(2)} ₺
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Masa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Garson
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tarih
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Durum
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Toplam
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.tables.table_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.users.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', 
                    tr ? { locale: tr } : {}
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      order.status === 'open'
                        ? 'bg-yellow-100 text-yellow-800'
                        : order.status === 'sent'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {order.status === 'open'
                      ? 'Açık'
                      : order.status === 'sent'
                      ? 'Gönderildi'
                      : 'Ödendi'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {order.total_price.toFixed(2)} ₺
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      showReceiptPreview(order)
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Adisyon Yazdır"
                  >
                    <Printer className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {orders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Sipariş bulunamadı
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4 gap-2">
                <h2 className="text-lg sm:text-2xl font-bold flex-1">
                  Sipariş Detayı - Masa {selectedOrder.tables.table_number}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Garson</div>
                    <div className="font-medium">{selectedOrder.users.name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Tarih</div>
                    <div className="font-medium">
                      {format(new Date(selectedOrder.created_at), 'dd.MM.yyyy HH:mm', 
                        tr ? { locale: tr } : {}
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Durum</div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          selectedOrder.status === 'open'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedOrder.status === 'sent'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {selectedOrder.status === 'open'
                          ? 'Açık'
                          : selectedOrder.status === 'sent'
                          ? 'Gönderildi'
                          : 'Ödendi'}
                      </span>
                    </div>
                  </div>
                  {selectedOrder.paid_at && (
                    <div>
                      <div className="text-sm text-gray-600">Ödeme Tarihi</div>
                      <div className="font-medium">
                        {format(new Date(selectedOrder.paid_at), 'dd.MM.yyyy HH:mm', 
                          tr ? { locale: tr } : {}
                        )}
                      </div>
                    </div>
                  )}
                  {selectedOrder.payment_method && (
                    <div>
                      <div className="text-sm text-gray-600">Ödeme Yöntemi</div>
                      <div className="font-medium">
                        {selectedOrder.payment_method === 'cash' ? 'Nakit' :
                         selectedOrder.payment_method === 'credit_card' ? 'Kredi Kartı' :
                         'IBAN'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Sipariş Edilen Ürünler</h3>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <div className="font-medium">{item.products.name}</div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} x {item.price.toFixed(2)} ₺
                          </div>
                          {item.note && (
                            <div className="text-xs text-indigo-600 mt-1 italic">
                              📝 {item.note}
                            </div>
                          )}
                          {item.is_sent_to_kitchen && (
                            <span className="text-xs text-blue-600">✓ Mutfağa gönderildi</span>
                          )}
                        </div>
                        <div className="font-semibold">
                          {(item.quantity * item.price).toFixed(2)} ₺
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Toplam:</span>
                    <span>{selectedOrder.total_price.toFixed(2)} ₺</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t flex-wrap">
                  {selectedOrder.status !== 'paid' && (
                    <button
                      onClick={() => {
                        openPaymentModal(selectedOrder.id)
                        setSelectedOrder(null)
                      }}
                      className="flex-1 min-w-[140px] px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Ödeme Al
                    </button>
                  )}
                  <button
                    onClick={() => {
                      showReceiptPreview(selectedOrder)
                      setSelectedOrder(null)
                    }}
                    className="flex-1 min-w-[140px] px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Adisyon Yazdır
                  </button>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 min-w-[100px] px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Ödeme Yöntemi Seç</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentOrderId(null)
                  setSelectedPaymentMethod(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      💵
                    </div>
                    <div>
                      <div className="font-semibold">Nakit</div>
                      <div className="text-sm text-gray-500">Nakit ödeme</div>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'cash' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('credit_card')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPaymentMethod === 'credit_card'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold">Kredi Kartı</div>
                      <div className="text-sm text-gray-500">Kredi kartı ile ödeme</div>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'credit_card' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedPaymentMethod('iban')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  selectedPaymentMethod === 'iban'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      🏦
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">IBAN ile Ödeme</div>
                      <div className="text-sm text-gray-500">Havale/EFT ile ödeme</div>
                      {restaurantIban && (
                        <div className="text-xs text-gray-600 mt-1 font-mono">
                          IBAN: {restaurantIban}
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedPaymentMethod === 'iban' && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  setPaymentOrderId(null)
                  setSelectedPaymentMethod(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && receiptContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-xl font-bold">Adisyon Önizleme</h3>
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setReceiptContent('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="bg-white p-6 rounded shadow-sm max-w-md mx-auto" style={{ width: '80mm' }}>
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: receiptContent.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/, '').replace(/<\/body>[\s\S]*?<\/html>/, '').replace(/<script[\s\S]*?<\/script>/g, '')
                  }} 
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-3 bg-white">
              <button
                onClick={() => {
                  setShowReceiptModal(false)
                  setReceiptContent('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Kapat
              </button>
              <button
                onClick={() => {
                  printReceipt()
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
