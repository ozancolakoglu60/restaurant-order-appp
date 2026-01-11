'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { formatDistanceToNow, format } from 'date-fns'
import tr from 'date-fns/locale/tr'
import { Plus, Trash2, CreditCard, Printer, X } from 'lucide-react'

type Table = Database['public']['Tables']['tables']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items?: (Database['public']['Tables']['order_items']['Row'] & {
    products: Product
  })[]
  users?: Database['public']['Tables']['users']['Row']
}

export default function TablesDashboard() {
  const [tables, setTables] = useState<(Table & { order?: Order })[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedTableOrders, setSelectedTableOrders] = useState<Order[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
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

  useEffect(() => {
    if (!supabase) return
    
    loadRestaurantCode()
    loadTables()

    // Subscribe to realtime changes
    const channel = supabase
      .channel('admin-tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
        },
        () => {
          loadTables()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          loadTables()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        () => {
          loadTables()
        }
      )
      .subscribe()

    return () => {
      if (supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase])

  const loadRestaurantCode = async () => {
    if (!supabase) return
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

  const loadTables = async () => {
    if (!supabase) return
    // Get user's restaurant_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.restaurant_id) return

    // Load all tables for this restaurant
    const { data: tablesData } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', userProfile.restaurant_id)
      .order('table_number', { ascending: true })

    if (!tablesData) return

    // Get table IDs for filtering orders
    const tableIds = tablesData.map(t => t.id)

    // Load active orders with order items and products for each table
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (*)
        )
      `)
      .in('table_id', tableIds)
      .in('status', ['open', 'sent'])

    const tablesWithOrders = tablesData.map((table) => {
      const order = ordersData?.find((o) => o.table_id === table.id)
      return { ...table, order }
    })

    setTables(tablesWithOrders)
    setLoading(false)
  }

  const getTableColor = (table: Table & { order?: Order }) => {
    // If there's an active order, table should be occupied (red)
    // Otherwise check table status
    const isOccupied = table.order || table.status === 'occupied'
    
    if (isOccupied) {
      return 'bg-red-200 border-red-600 text-red-900 border-2'
    } else {
      return 'bg-green-100 border-green-400 text-green-800'
    }
  }

  const getOpenDuration = (order?: Order) => {
    if (!order) return null
    try {
      return formatDistanceToNow(new Date(order.created_at), {
        addSuffix: false,
        ...(tr && { locale: tr }),
      })
    } catch {
      return null
    }
  }

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = e.currentTarget
    if (!form || !(form instanceof HTMLFormElement)) {
      alert('Form bulunamadı')
      return
    }

    // FormData'yı hemen oluştur
    const formData = new FormData(form)
    const tableNumber = parseInt(formData.get('table_number') as string)

    if (!tableNumber || tableNumber <= 0) {
      alert('Lütfen geçerli bir masa numarası girin')
      return
    }
    
    // Get user's restaurant_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('Kullanıcı bilgisi alınamadı')
      return
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('restaurant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile?.restaurant_id) {
      alert('Restoran bilgisi bulunamadı')
      return
    }

    const { error } = await supabase.from('tables').insert({
      restaurant_id: userProfile.restaurant_id,
      table_number: tableNumber,
      status: 'empty',
    } as any)

    if (error) {
      if (error.code === '23505') {
        alert('Bu masa numarası zaten mevcut')
      } else {
        alert('Hata: ' + error.message)
      }
    } else {
      await loadTables()
      setShowAddForm(false)
      form.reset()
    }
  }

  const handleDeleteTable = async (id: string, tableNumber: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!supabase) return
    if (!confirm(`Masa ${tableNumber}'ı silmek istediğinize emin misiniz?`)) {
      return
    }

    const { error } = await supabase.from('tables').delete().eq('id', id)

    if (error) {
      alert('Hata: ' + error.message)
    } else {
      await loadTables()
    }
  }

  const handleTableClick = async (table: Table) => {
    if (!supabase) return
    // Load all orders for this table
    const { data: ordersData } = await supabase
      .from('orders')
      .select(`
        *,
        users (*),
        order_items (
          *,
          products (*)
        )
      `)
      .eq('table_id', table.id)
      .order('created_at', { ascending: false })

    if (ordersData && ordersData.length > 0) {
      setSelectedTableOrders(ordersData as Order[])
      setSelectedTable(table)
    } else {
      alert('Bu masada henüz sipariş bulunmuyor.')
    }
  }

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
    await loadTables()
    // Reload orders for selected table
    if (selectedTable) {
      handleTableClick(selectedTable)
    }
  }

  const showReceiptPreview = (order: Order) => {
    try {
      if (!order || !selectedTable || !order.order_items) {
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
          <title>Adisyon - Masa ${selectedTable.table_number}</title>
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
            <div><strong>Masa:</strong> ${selectedTable.table_number}</div>
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

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Masalar</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Masa Ekle
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <form onSubmit={handleAddTable} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full sm:w-auto">
              <label htmlFor="table_number" className="block text-sm font-medium text-gray-700 mb-1">
                Masa Numarası
              </label>
              <input
                type="number"
                id="table_number"
                name="table_number"
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Masa numarası"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full sm:w-auto"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 w-full sm:w-auto"
            >
              İptal
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`p-4 rounded-lg border-2 ${getTableColor(table)} relative cursor-pointer hover:opacity-80 transition-opacity`}
          >
            <button
              onClick={(e) => handleDeleteTable(table.id, table.table_number, e)}
              className="absolute top-2 right-2 text-red-600 hover:text-red-800 z-10"
              title="Masayı Sil"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">Masa {table.table_number}</div>
              <div className={`text-sm font-semibold mb-2 ${
                (table.order || table.status === 'occupied') ? 'text-red-700' : 'text-green-700'
              }`}>
                {(table.order || table.status === 'occupied') ? '🔴 Dolu' : '🟢 Boş'}
              </div>
              {table.order && (
                <div className="text-xs mt-2 space-y-1 pt-2 border-t border-current border-opacity-20">
                  <div className="font-semibold">
                    ⏱️ {getOpenDuration(table.order) || '-'}
                  </div>
                  <div>
                    💰 {table.order.total_price.toFixed(2)} ₺
                  </div>
                  <div className="text-xs opacity-75 mb-2">
                    {table.order.status === 'open' ? '📝 Açık' : table.order.status === 'sent' ? '🚀 Gönderildi' : '✅ Ödendi'}
                  </div>
                  {table.order.order_items && table.order.order_items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-current border-opacity-10">
                      <div className="font-semibold mb-1 text-xs">Siparişler:</div>
                      <div className="space-y-0.5 max-h-20 overflow-y-auto text-xs">
                        {table.order.order_items.slice(0, 3).map((item) => (
                          <div key={item.id} className="truncate">
                            • {item.quantity}x {item.products.name}
                            {item.note && <span className="text-indigo-600 italic"> ({item.note})</span>}
                          </div>
                        ))}
                        {table.order.order_items.length > 3 && (
                          <div className="text-xs opacity-75 italic">
                            +{table.order.order_items.length - 3} ürün daha...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!table.order && table.status === 'occupied' && (
                <div className="text-xs mt-2 text-red-600">
                  Sipariş bilgisi yükleniyor...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Orders Modal for Selected Table */}
      {selectedTableOrders.length > 0 && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4 gap-2">
                <h2 className="text-lg sm:text-2xl font-bold flex-1">
                  Masa {selectedTable.table_number} - Siparişler ve Ödeme
                </h2>
                <button
                  onClick={() => {
                    setSelectedTableOrders([])
                    setSelectedTable(null)
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl flex-shrink-0"
                  aria-label="Kapat"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {selectedTableOrders.map((order) => {
                  const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-lg border-2 ${
                        order.status === 'paid'
                          ? 'bg-green-50 border-green-200'
                          : order.status === 'sent'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                        <div>
                          <div className="font-semibold text-base sm:text-lg">
                            {order.users?.name || 'Garson'} - {totalItems} ürün
                          </div>
                          <div className="text-sm text-gray-600">
                            {format(new Date(order.created_at), 'dd.MM.yyyy HH:mm', 
                              tr ? { locale: tr } : {}
                            )}
                          </div>
                          <div className="mt-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'open'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'sent'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {order.status === 'open'
                                ? 'Açık'
                                : order.status === 'sent'
                                ? 'Gönderildi'
                                : 'Ödendi'}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <div className="text-lg sm:text-xl font-bold">
                            {order.total_price.toFixed(2)} ₺
                          </div>
                        </div>
                      </div>

                      {order.order_items && order.order_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-semibold mb-2">Sipariş Edilen Ürünler:</div>
                          <div className="space-y-1">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium">{item.quantity}x {item.products.name}</span>
                                  {item.note && (
                                    <span className="ml-2 text-xs text-indigo-600 italic">📝 {item.note}</span>
                                  )}
                                  {item.is_sent_to_kitchen && (
                                    <span className="ml-2 text-xs text-blue-600">✓ Gönderildi</span>
                                  )}
                                </div>
                                <div className="font-medium">
                                  {(item.quantity * item.price).toFixed(2)} ₺
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-gray-200">
                        {order.status !== 'paid' && (
                          <button
                            onClick={() => openPaymentModal(order.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            Ödeme Al
                          </button>
                        )}
                        <button
                          onClick={() => showReceiptPreview(order)}
                          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                        >
                          <Printer className="w-4 h-4" />
                          Adisyon Yazdır
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedTableOrders([])
                    setSelectedTable(null)
                  }}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Kapat
                </button>
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
