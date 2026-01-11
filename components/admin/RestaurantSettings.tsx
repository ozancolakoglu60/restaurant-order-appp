'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RestaurantSettings() {
  const supabase = useMemo(() => {
    if (typeof window !== 'undefined') {
      return createClient()
    }
    return null
  }, [])
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurant, setRestaurant] = useState<{
    id: string
    code: string
    name: string
    iban: string | null
  } | null>(null)
  const [iban, setIban] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    loadRestaurant()
  }, [supabase])

  const loadRestaurant = async () => {
    if (!supabase) return
    
    setLoading(true)
    setError(null)
    
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('Kullanıcı bulunamadı')
        setLoading(false)
        return
      }

      const { data: userProfile } = await supabase
        .from('users')
        .select('restaurant_id')
        .eq('id', user.id)
        .single()

      if (!userProfile?.restaurant_id) {
        setError('Restoran bilgisi bulunamadı')
        setLoading(false)
        return
      }

      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, code, name, iban')
        .eq('id', userProfile.restaurant_id)
        .single()

      if (restaurantError) {
        setError('Restoran bilgileri yüklenemedi: ' + restaurantError.message)
        setLoading(false)
        return
      }

      if (restaurantData) {
        setRestaurant(restaurantData as any)
        setIban(restaurantData.iban || '')
      }
    } catch (err: any) {
      setError('Bir hata oluştu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !restaurant) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          iban: iban.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', restaurant.id)

      if (updateError) {
        setError('Güncelleme başarısız: ' + updateError.message)
        setSaving(false)
        return
      }

      setSuccess('Restoran bilgileri başarıyla güncellendi!')
      await loadRestaurant()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null)
      }, 3000)
    } catch (err: any) {
      setError('Bir hata oluştu: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">{error || 'Restoran bilgisi bulunamadı'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Restoran Bilgileri</h3>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restoran Kodu
            </label>
            <input
              type="text"
              value={restaurant.code}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Restoran kodu değiştirilemez
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restoran Adı
            </label>
            <input
              type="text"
              value={restaurant.name}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Restoran adı değiştirilemez
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-gray-700 mb-1">
                IBAN
              </label>
              <input
                id="iban"
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                IBAN bilgisi ödeme seçeneklerinde gösterilir. Boş bırakılabilir.
              </p>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kaydediliyor...
                  </span>
                ) : (
                  'Kaydet'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Bilgi</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• IBAN bilgisi admin ekranında ödeme seçeneklerinde gösterilir</li>
          <li>• IBAN eklenirse, müşteriler IBAN ile ödeme seçeneğini görebilir</li>
          <li>• IBAN boş bırakılırsa, sadece nakit ve kredi kartı seçenekleri gösterilir</li>
        </ul>
      </div>
    </div>
  )
}
