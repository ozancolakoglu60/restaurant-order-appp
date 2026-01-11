'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row']

export default function WaitersList() {
  const [waiters, setWaiters] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])

  useEffect(() => {
    if (!supabase) return
    loadWaiters()
  }, [supabase])

  const loadWaiters = async () => {
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

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'waiter')
      .eq('restaurant_id', userProfile.restaurant_id)
      .order('name')

    if (data) {
      setWaiters(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Ad
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Oluşturulma Tarihi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {waiters.map((waiter) => (
            <tr key={waiter.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {waiter.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                  Garson
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(waiter.created_at).toLocaleDateString('tr-TR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {waiters.length === 0 && (
        <div className="text-center py-8 text-gray-500">Garson bulunamadı</div>
      )}
    </div>
  )
}
