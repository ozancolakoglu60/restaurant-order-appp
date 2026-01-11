'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { format, startOfDay, endOfDay, subDays } from 'date-fns'
import tr from 'date-fns/locale/tr'

type Order = Database['public']['Tables']['orders']['Row'] & {
  users: Database['public']['Tables']['users']['Row']
}

export default function ReportsDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])

  useEffect(() => {
    if (!supabase) return
    loadOrders()
  }, [dateRange, supabase])

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

    let startDate: Date
    const endDate = endOfDay(new Date())

    switch (dateRange) {
      case 'today':
        startDate = startOfDay(new Date())
        break
      case 'week':
        startDate = startOfDay(subDays(new Date(), 7))
        break
      case 'month':
        startDate = startOfDay(subDays(new Date(), 30))
        break
    }

    const { data } = await supabase
      .from('orders')
      .select(
        `
        *,
        users (*)
      `
      )
      .in('table_id', tableIds)
      .eq('status', 'paid')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (data) {
      setOrders(data as Order[])
    }
    setLoading(false)
  }

  const getTotalRevenue = () => {
    return orders.reduce((sum, order) => sum + Number(order.total_price), 0)
  }

  const getOrderCount = () => {
    return orders.length
  }

  const getAverageOrderValue = () => {
    if (orders.length === 0) return 0
    return getTotalRevenue() / orders.length
  }

  const getWaiterStats = () => {
    const stats: Record<string, { count: number; revenue: number }> = {}

    orders.forEach((order) => {
      const waiterName = order.users.name
      if (!stats[waiterName]) {
        stats[waiterName] = { count: 0, revenue: 0 }
      }
      stats[waiterName].count++
      stats[waiterName].revenue += Number(order.total_price)
    })

    return Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
    }))
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  const waiterStats = getWaiterStats()

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setDateRange('today')}
          className={`px-4 py-2 rounded ${
            dateRange === 'today' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Bugün
        </button>
        <button
          onClick={() => setDateRange('week')}
          className={`px-4 py-2 rounded ${
            dateRange === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Son 7 Gün
        </button>
        <button
          onClick={() => setDateRange('month')}
          className={`px-4 py-2 rounded ${
            dateRange === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
          }`}
        >
          Son 30 Gün
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Toplam Ciro</div>
          <div className="text-3xl font-bold text-green-600">
            {getTotalRevenue().toFixed(2)} ₺
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Sipariş Sayısı</div>
          <div className="text-3xl font-bold text-blue-600">{getOrderCount()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Ortalama Sipariş</div>
          <div className="text-3xl font-bold text-purple-600">
            {getAverageOrderValue().toFixed(2)} ₺
          </div>
        </div>
      </div>

      {/* Waiter Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Garson İstatistikleri</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Garson
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sipariş Sayısı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Toplam Ciro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ortalama
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {waiterStats.map((stat) => (
                <tr key={stat.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {stat.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {stat.revenue.toFixed(2)} ₺
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(stat.revenue / stat.count).toFixed(2)} ₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {waiterStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Bu dönemde veri bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
