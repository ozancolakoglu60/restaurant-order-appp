'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Database } from '@/lib/supabase/database.types'
import { formatDistanceToNow } from 'date-fns'
import tr from 'date-fns/locale/tr'

type Table = Database['public']['Tables']['tables']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items?: (Database['public']['Tables']['order_items']['Row'] & {
    products: Product
  })[]
}

export default function TablesList() {
  const router = useRouter()
  const [tables, setTables] = useState<(Table & { order?: Order })[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])

  useEffect(() => {
    if (!supabase) return
    
    loadTables()

    // Subscribe to table changes
    const channel = supabase
      .channel('tables-changes')
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

  const loadTables = async () => {
    if (!supabase) return
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

    // Load all tables for this restaurant
    const { data: tablesData, error: tablesError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', userProfile.restaurant_id)
      .order('table_number', { ascending: true })

    if (tablesError) {
      console.error('Error loading tables:', tablesError)
      setLoading(false)
      return
    }

    if (!tablesData) {
      setLoading(false)
      return
    }

    // Get table IDs for filtering orders
    const tableIds = tablesData.map(t => t.id)

    // Load active orders with order items and products for each table
    // Only one order per table
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

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => router.push(`/waiter/table/${table.id}`)}
          className={`p-4 rounded-lg border-2 transition-all ${
            (table.order || table.status === 'occupied')
              ? 'bg-red-200 border-red-600 hover:bg-red-300 text-red-900 border-2'
              : 'bg-green-100 border-green-400 hover:bg-green-200 text-green-800'
          }`}
          >
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">Masa {table.table_number}</div>
            <div
              className={`text-sm font-semibold mb-2 ${
                (table.order || table.status === 'occupied') ? 'text-red-700' : 'text-green-700'
              }`}
            >
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
                  {table.order.status === 'open' ? '📝 Açık' : '🚀 Gönderildi'}
                </div>
                {table.order.order_items && table.order.order_items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-10">
                    <div className="font-semibold mb-1 text-xs">Siparişler:</div>
                    <div className="space-y-0.5 max-h-20 overflow-y-auto text-xs">
                      {table.order.order_items.slice(0, 3).map((item) => (
                        <div key={item.id} className="truncate">
                          • {item.quantity}x {item.products.name}
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
          </div>
        </button>
      ))}
    </div>
  )
}
