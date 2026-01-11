'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import OSLogo from '@/components/OSLogo'
import type { Database } from '@/lib/supabase/database.types'

type RegistrationType = 'restaurant' | 'waiter'

export default function RegisterPage() {
  const router = useRouter()
  const [type, setType] = useState<RegistrationType>('restaurant')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Restaurant fields
  const [restaurantCode, setRestaurantCode] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantIban, setRestaurantIban] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminName, setAdminName] = useState('')

  // Waiter fields
  const [waiterRestaurantCode, setWaiterRestaurantCode] = useState('')
  const [waiterEmail, setWaiterEmail] = useState('')
  const [waiterPassword, setWaiterPassword] = useState('')
  const [waiterName, setWaiterName] = useState('')

  const handleRestaurantRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Validate fields
      if (!restaurantCode || !restaurantName || !adminEmail || !adminPassword || !adminName) {
        setError('Lütfen tüm alanları doldurun')
        setLoading(false)
        return
      }

      // Check if restaurant code already exists
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('code')
        .eq('code', restaurantCode.toUpperCase().trim())
        .single()

      if (existingRestaurant) {
        setError('Bu restoran kodu zaten kullanılıyor')
        setLoading(false)
        return
      }

      // Create restaurant and admin user via API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'restaurant',
          restaurantCode: restaurantCode.toUpperCase().trim(),
          restaurantName,
          restaurantIban: restaurantIban.trim(),
          adminEmail,
          adminPassword,
          adminName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }

      setSuccess('Restoran ve admin kullanıcısı başarıyla oluşturuldu! Giriş yapabilirsiniz.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  const handleWaiterRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Validate fields
      if (!waiterRestaurantCode || !waiterEmail || !waiterPassword || !waiterName) {
        setError('Lütfen tüm alanları doldurun')
        setLoading(false)
        return
      }

      // Check if restaurant exists
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('code', waiterRestaurantCode.toUpperCase().trim())
        .single()

      if (restaurantError || !restaurantData) {
        setError('Geçersiz restoran kodu')
        setLoading(false)
        return
      }

      // TypeScript tip kontrolü - restaurantData'nın id özelliğini güvenli şekilde alıyoruz
      const restaurantId: string = typeof restaurantData === 'object' && restaurantData !== null && 'id' in restaurantData 
        ? String(restaurantData.id) 
        : ''

      if (!restaurantId) {
        setError('Geçersiz restoran kodu')
        setLoading(false)
        return
      }

      // Create waiter user via API
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'waiter',
          restaurantId,
          waiterEmail,
          waiterPassword,
          waiterName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Kayıt başarısız')
        setLoading(false)
        return
      }

      setSuccess('Garson kullanıcısı başarıyla oluşturuldu! Giriş yapabilirsiniz.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'Bir hata oluştu')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 px-4 py-6 sm:py-8">
      <div className="max-w-2xl w-full space-y-6 sm:space-y-8 bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center">
          <OSLogo size="large" />
          <p className="mt-4 text-center text-sm text-gray-600 font-medium">
            Hesabınızı oluşturun
          </p>
        </div>

        {/* Toggle between restaurant and waiter registration */}
        <div className="flex justify-center gap-4 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setType('restaurant')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              type === 'restaurant'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-transparent text-gray-700 hover:text-indigo-600'
            }`}
          >
            Yeni Restoran Kaydı
          </button>
          <button
            type="button"
            onClick={() => setType('waiter')}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
              type === 'waiter'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                : 'bg-transparent text-gray-700 hover:text-indigo-600'
            }`}
          >
            Garson Kaydı
          </button>
        </div>

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

        {type === 'restaurant' ? (
          <form className="mt-8 space-y-6" onSubmit={handleRestaurantRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="restaurantCode" className="block text-sm font-medium text-gray-700">
                  Restoran Kodu *
                </label>
                <input
                  id="restaurantCode"
                  name="restaurantCode"
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Örn: REST001"
                  value={restaurantCode}
                  onChange={(e) => setRestaurantCode(e.target.value.toUpperCase())}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Restoran kodunuz giriş yaparken kullanılacak (büyük harf)
                </p>
              </div>

              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700">
                  Restoran Adı *
                </label>
                <input
                  id="restaurantName"
                  name="restaurantName"
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Örn: Lezzet Durağı"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="restaurantIban" className="block text-sm font-medium text-gray-700">
                  IBAN (Opsiyonel)
                </label>
                <input
                  id="restaurantIban"
                  name="restaurantIban"
                  type="text"
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="TR00 0000 0000 0000 0000 0000 00"
                  value={restaurantIban}
                  onChange={(e) => setRestaurantIban(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  IBAN bilgisi ödeme seçeneklerinde gösterilir
                </p>
              </div>

              <div>
                <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                  Admin Adı Soyadı *
                </label>
                <input
                  id="adminName"
                  name="adminName"
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Admin E-posta *
                </label>
                <input
                  id="adminEmail"
                  name="adminEmail"
                  type="email"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="admin@restoran.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                  Admin Şifre *
                </label>
                <input
                  id="adminPassword"
                  name="adminPassword"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="En az 6 karakter"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kayıt yapılıyor...
                  </span>
                ) : (
                  'Restoran Kaydı Oluştur'
                )}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleWaiterRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="waiterRestaurantCode" className="block text-sm font-medium text-gray-700">
                  Restoran Kodu *
                </label>
                <input
                  id="waiterRestaurantCode"
                  name="waiterRestaurantCode"
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Çalıştığınız restoranın kodu"
                  value={waiterRestaurantCode}
                  onChange={(e) => setWaiterRestaurantCode(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label htmlFor="waiterName" className="block text-sm font-medium text-gray-700">
                  Ad Soyad *
                </label>
                <input
                  id="waiterName"
                  name="waiterName"
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Örn: Mehmet Demir"
                  value={waiterName}
                  onChange={(e) => setWaiterName(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="waiterEmail" className="block text-sm font-medium text-gray-700">
                  E-posta *
                </label>
                <input
                  id="waiterEmail"
                  name="waiterEmail"
                  type="email"
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="garson@restoran.com"
                  value={waiterEmail}
                  onChange={(e) => setWaiterEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="waiterPassword" className="block text-sm font-medium text-gray-700">
                  Şifre *
                </label>
                <input
                  id="waiterPassword"
                  name="waiterPassword"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="En az 6 karakter"
                  value={waiterPassword}
                  onChange={(e) => setWaiterPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Kayıt yapılıyor...
                  </span>
                ) : (
                  'Garson Kaydı Oluştur'
                )}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Zaten hesabınız var mı? <span className="underline">Giriş yapın</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
