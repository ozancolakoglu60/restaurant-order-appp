'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import OSLogo from '@/components/OSLogo'

export default function LoginPage() {
  const router = useRouter()
  const [restaurantCode, setRestaurantCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) {
      console.log('⚠️ Zaten giriş yapılıyor, tekrar deneme engellendi')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      console.log('🔐 Giriş deneniyor:', email, 'Restoran Kodu:', restaurantCode)
      
      if (!restaurantCode || !email || !password) {
        setError('Lütfen restoran kodu, e-posta ve şifre girin')
        setLoading(false)
        return
      }

      // Check if restaurant exists
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('code', restaurantCode.toUpperCase().trim())
        .single()

      if (restaurantError || !restaurantData) {
        console.error('❌ Restoran bulunamadı:', restaurantError)
        setError('Geçersiz restoran kodu')
        setLoading(false)
        return
      }

      const restaurant = restaurantData as { id: string; name: string }
      console.log('✅ Restoran bulundu:', restaurant.name)

      // First, try to authenticate to get user
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('❌ Giriş hatası:', signInError)
        setError(signInError.message || 'Giriş yapılırken bir hata oluştu')
        setLoading(false)
        return
      }

      console.log('✅ Giriş başarılı, kullanıcı:', data.user?.email)

      if (!data.user) {
        setError('Kullanıcı bilgisi alınamadı')
        setLoading(false)
        return
      }

      console.log('👤 Kullanıcı ID:', data.user.id)
      
      // Get user profile to check restaurant_id BEFORE allowing access
      let profile: { role: 'admin' | 'waiter'; name: string; restaurant_id: string | null } | null = null
      let { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('role, name, restaurant_id')
        .eq('id', data.user.id)
        .single()

      console.log('📋 Profil sorgusu sonucu:', { profileData, profileError })

      // If profile doesn't exist, create one with default 'waiter' role and restaurant
      if (profileError && profileError.code === 'PGRST116') {
        console.log('⚠️ Profil bulunamadı, oluşturuluyor...')
        const userName = data.user.email?.split('@')[0] || 'Kullanıcı'
        const insertResult = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            name: userName,
            role: 'waiter' as const,
            restaurant_id: restaurant.id
          } as any)
          .select('role, name, restaurant_id')
          .single()

        if (insertResult.error) {
          console.error('❌ Profil oluşturma hatası:', insertResult.error)
          // Sign out if profile creation fails
          await supabase.auth.signOut()
          setError(`Profil oluşturulamadı: ${insertResult.error.message}`)
          setLoading(false)
          return
        }

          profile = insertResult.data as { role: 'admin' | 'waiter'; name: string; restaurant_id: string | null }
        console.log('✅ Profil oluşturuldu:', profile)
      } else if (profileError) {
        console.error('❌ Profil hatası:', profileError)
        // Sign out if profile cannot be retrieved
        await supabase.auth.signOut()
        setError(`Profil alınamadı: ${profileError.message}`)
        setLoading(false)
        return
      } else {
        profile = profileData as { role: 'admin' | 'waiter'; name: string; restaurant_id: string | null } | null
        console.log('✅ Profil bulundu:', profile)
        
        if (!profile) {
          console.error('❌ Profil null')
          await supabase.auth.signOut()
          setError('Kullanıcı profili bulunamadı. Lütfen yöneticinize başvurun.')
          setLoading(false)
          return
        }
        
        // CRITICAL SECURITY CHECK: User MUST belong to the entered restaurant
        // DOUBLE CHECK: Verify restaurant_id matches BEFORE allowing any access
        if (!profile.restaurant_id) {
          // CRITICAL SECURITY: If existing user has no restaurant_id, REJECT login
          console.error('❌ GÜVENLİK: Eski kullanıcının restaurant_id yok!', {
            userEmail: data.user.email,
            enteredRestaurantCode: restaurantCode
          })
          await supabase.auth.signOut()
          setError('Bu kullanıcının restoran bilgisi tanımlanmamış. Lütfen yöneticinize başvurun.')
          setLoading(false)
          return
        }

        // CRITICAL: If restaurant_id exists, it MUST match exactly - NO EXCEPTIONS
        if (profile.restaurant_id !== restaurant.id) {
          console.error('❌ GÜVENLİK İHLALİ: Kullanıcı bu restorana ait değil!', {
            userEmail: data.user.email,
            userRestaurantId: profile.restaurant_id,
            enteredRestaurantId: restaurant.id,
            enteredRestaurantCode: restaurantCode.toUpperCase().trim(),
            userProfile: profile
          })
          // CRITICAL: Sign out immediately if restaurant doesn't match
          await supabase.auth.signOut()
          // Clear any existing session
          await new Promise(resolve => setTimeout(resolve, 100))
          setError('Bu kullanıcı bu restorana ait değil. Lütfen doğru restoran kodu ile giriş yapın.')
          setLoading(false)
          return
        }
        
        // Only proceed if restaurant_id matches exactly
        console.log('✅ Restaurant ID eşleşiyor, girişe izin veriliyor', {
          userRestaurantId: profile.restaurant_id,
          enteredRestaurantId: restaurant.id
        })
      }

        if (profile) {
          console.log('🚀 Yönlendiriliyor, rol:', profile.role)
          
          // Session'ın kaydedilmesi için bekleme
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Session'ı kontrol et
          const { data: { session } } = await supabase.auth.getSession()
          console.log('🔐 Session durumu:', session ? 'Mevcut' : 'Yok')
          
          if (!session) {
            console.error('❌ Session kaydedilmedi!')
            console.error('Session detayları:', { session, user: data.user })
            setError('Oturum açılamadı. Lütfen tekrar deneyin.')
            setLoading(false)
            return
          }
          
          console.log('✅ Session mevcut, yönlendiriliyor...')
          setLoading(false)
          
          // Cookie'lerin yazılması için biraz daha bekle
          await new Promise(resolve => setTimeout(resolve, 500))
          
          if (profile.role === 'admin') {
            console.log('🚀 Admin paneline yönlendiriliyor...')
            window.location.href = '/admin'
          } else if (profile.role === 'waiter') {
            console.log('🚀 Garson paneline yönlendiriliyor...')
            window.location.href = '/waiter'
          } else {
            setError('Geçersiz kullanıcı rolü')
            setLoading(false)
            return
          }
        } else {
          console.error('❌ Profil null')
          await supabase.auth.signOut()
          setError('Kullanıcı profili bulunamadı. Lütfen yöneticinize başvurun.')
          setLoading(false)
          return
        }
    } catch (error: any) {
      console.error('❌ Beklenmeyen hata:', error)
      setError(`Bir hata oluştu: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 px-4 py-6 sm:py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-white p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center">
          <OSLogo size="large" />
          <p className="mt-4 text-center text-sm text-gray-600 font-medium">
            Hesabınıza giriş yapın
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin} noValidate>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="restaurantCode" className="block text-sm font-medium text-gray-700 mb-2">
                Restoran Kodu
              </label>
              <input
                id="restaurantCode"
                name="restaurantCode"
                type="text"
                autoComplete="off"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="REST001"
                value={restaurantCode}
                onChange={(e) => setRestaurantCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Giriş yapılıyor...
                </span>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-6 pt-6 border-t border-gray-200">
          <Link href="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
            Hesabınız yok mu? <span className="underline">Kayıt olun</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
