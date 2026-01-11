/**
 * Test kullanıcıları oluşturma script'i
 * 
 * Kullanım:
 * 1. .env.local dosyanıza SUPABASE_SERVICE_ROLE_KEY ekleyin
 * 2. npx tsx scripts/create-test-users.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// .env.local dosyasını yükle
config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Hata: .env.local dosyanızda şu değişkenlerin olduğundan emin olun:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\n💡 Supabase Service Role Key\'i şuradan alabilirsiniz:')
  console.error('   Supabase Dashboard > Settings > API > service_role (secret)')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  {
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin Kullanıcı',
    role: 'admin' as const
  },
  {
    email: 'garson@test.com',
    password: 'garson123',
    name: 'Garson Kullanıcı',
    role: 'waiter' as const
  }
]

async function createTestUsers() {
  console.log('🚀 Test kullanıcıları oluşturuluyor...\n')

  // Önce REST001 restoranını bul veya oluştur
  let restaurantId: string | null = null
  
  console.log('🔍 REST001 restoranı kontrol ediliyor...')
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('code', 'REST001')
    .single()

  if (restaurantError || !restaurant) {
    console.log('   ⚠️  REST001 restoranı bulunamadı, oluşturuluyor...')
    const { data: newRestaurant, error: createError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        code: 'REST001',
        name: 'Test Restoranı'
      })
      .select('id')
      .single()

    if (createError || !newRestaurant) {
      console.error('   ❌ Restoran oluşturulamadı:', createError?.message)
      console.error('   💡 Lütfen önce migration-restaurants.sql dosyasını çalıştırın!')
      process.exit(1)
    }
    
    restaurantId = newRestaurant.id
    console.log('   ✅ REST001 restoranı oluşturuldu')
  } else {
    restaurantId = restaurant.id
    console.log('   ✅ REST001 restoranı bulundu')
  }
  console.log('')

  for (const user of testUsers) {
    try {
      console.log(`📝 ${user.email} kullanıcısı oluşturuluyor...`)

      // Kullanıcıyı Auth'a ekle
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (authError) {
        // Kullanıcı zaten varsa
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered') ||
            authError.message.includes('already been registered')) {
          console.log(`   ℹ️  Kullanıcı zaten mevcut, profil kontrol ediliyor...`)
          
          const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
          
          if (listError) {
            console.log(`   ❌ Kullanıcı listesi alınamadı: ${listError.message}`)
            continue
          }
          
          const foundUser = existingUsers?.users.find(u => u.email === user.email)
          
          if (foundUser) {
            // Profil kontrolü
            const { data: existingProfile, error: selectError } = await supabaseAdmin
              .from('users')
              .select('*')
              .eq('id', foundUser.id)
              .single()

            if (selectError && selectError.code !== 'PGRST116') {
              console.log(`   ❌ Profil kontrol edilirken hata: ${selectError.message}`)
              if (selectError.message.includes('schema cache')) {
                console.log(`   ⚠️  Veritabanı şeması oluşturulmamış görünüyor.`)
                console.log(`   💡 Lütfen önce supabase/schema.sql dosyasını Supabase SQL Editor'de çalıştırın.`)
              }
              continue
            }

            if (existingProfile) {
              // Profil güncelle
              const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ 
                  name: user.name, 
                  role: user.role,
                  restaurant_id: restaurantId
                })
                .eq('id', foundUser.id)

              if (updateError) {
                console.log(`   ❌ Profil güncellenirken hata: ${updateError.message}`)
              } else {
                console.log(`   ✅ Profil güncellendi`)
              }
            } else {
              // Profil oluştur
              const { error: insertError } = await supabaseAdmin
                .from('users')
                .insert({
                  id: foundUser.id,
                  name: user.name,
                  role: user.role,
                  restaurant_id: restaurantId
                })

              if (insertError) {
                console.log(`   ❌ Profil oluşturulurken hata: ${insertError.message}`)
                if (insertError.message.includes('schema cache')) {
                  console.log(`   ⚠️  Veritabanı şeması oluşturulmamış görünüyor.`)
                  console.log(`   💡 Lütfen önce supabase/schema.sql dosyasını Supabase SQL Editor'de çalıştırın.`)
                }
              } else {
                console.log(`   ✅ Profil oluşturuldu`)
              }
            }
          } else {
            console.log(`   ⚠️  Kullanıcı auth'da bulundu ama detayları alınamadı`)
          }
          continue
        }
        
        console.log(`   ❌ Auth hatası: ${authError.message}`)
        continue
      }

      if (!authData.user) {
        console.log(`   ❌ Kullanıcı oluşturulamadı`)
        continue
      }

      // Profil oluştur
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name: user.name,
          role: user.role,
          restaurant_id: restaurantId
        })

      if (profileError) {
        console.log(`   ❌ Profil oluşturulurken hata: ${profileError.message}`)
      } else {
        console.log(`   ✅ Kullanıcı ve profil başarıyla oluşturuldu`)
      }
    } catch (error: any) {
      console.log(`   ❌ Beklenmeyen hata: ${error.message}`)
    }
    console.log('')
  }

  console.log('✅ Test kullanıcıları hazır!\n')
  console.log('📋 Giriş Bilgileri:')
  console.log('   Restoran Kodu: REST001')
  console.log('   Admin:')
  console.log('     Email: admin@test.com')
  console.log('     Şifre: admin123')
  console.log('   Garson:')
  console.log('     Email: garson@test.com')
  console.log('     Şifre: garson123')
}

createTestUsers().catch(console.error)