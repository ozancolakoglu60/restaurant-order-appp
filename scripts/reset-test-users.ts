/**
 * Test kullanıcılarını sıfırlama script'i
 * Kullanıcıların şifrelerini günceller ve profillerini kontrol eder
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

async function resetTestUsers() {
  console.log('🔄 Test kullanıcıları sıfırlanıyor...\n')

  for (const user of testUsers) {
    try {
      console.log(`📝 ${user.email} kullanıcısı kontrol ediliyor...`)

      // Kullanıcıyı bul
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        console.log(`   ❌ Kullanıcı listesi alınamadı: ${listError.message}`)
        continue
      }

      const foundUser = userList?.users.find(u => u.email === user.email)
      
      if (!foundUser) {
        console.log(`   ⚠️  Kullanıcı bulunamadı, oluşturuluyor...`)
        
        // Kullanıcı oluştur
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        })

        if (createError) {
          console.log(`   ❌ Kullanıcı oluşturulamadı: ${createError.message}`)
          continue
        }

        if (!authData.user) {
          console.log(`   ❌ Kullanıcı oluşturulamadı`)
          continue
        }

        // Profil oluştur
        const { error: profileError } = await supabaseAdmin
          .from('users')
          .upsert({
            id: authData.user.id,
            name: user.name,
            role: user.role
          })

        if (profileError) {
          console.log(`   ❌ Profil oluşturulamadı: ${profileError.message}`)
        } else {
          console.log(`   ✅ Kullanıcı ve profil oluşturuldu`)
        }
      } else {
        console.log(`   ℹ️  Kullanıcı mevcut, şifre ve profil güncelleniyor...`)

        // Şifreyi güncelle
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          foundUser.id,
          {
            password: user.password,
            email_confirm: true
          }
        )

        if (updateError) {
          console.log(`   ❌ Şifre güncellenemedi: ${updateError.message}`)
        } else {
          console.log(`   ✅ Şifre güncellendi`)
        }

        // Profil kontrolü ve güncelleme
        const { data: existingProfile } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', foundUser.id)
          .single()

        if (existingProfile) {
          // Profil güncelle
          const { error: profileUpdateError } = await supabaseAdmin
            .from('users')
            .update({ name: user.name, role: user.role })
            .eq('id', foundUser.id)

          if (profileUpdateError) {
            console.log(`   ❌ Profil güncellenemedi: ${profileUpdateError.message}`)
          } else {
            console.log(`   ✅ Profil güncellendi`)
          }
        } else {
          // Profil oluştur
          const { error: profileInsertError } = await supabaseAdmin
            .from('users')
            .upsert({
              id: foundUser.id,
              name: user.name,
              role: user.role
            })

          if (profileInsertError) {
            console.log(`   ❌ Profil oluşturulamadı: ${profileInsertError.message}`)
          } else {
            console.log(`   ✅ Profil oluşturuldu`)
          }
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Beklenmeyen hata: ${error.message}`)
    }
    console.log('')
  }

  console.log('✅ Test kullanıcıları hazır!\n')
  console.log('📋 Giriş Bilgileri:')
  console.log('   Admin:')
  console.log('     Email: admin@test.com')
  console.log('     Şifre: admin123')
  console.log('   Garson:')
  console.log('     Email: garson@test.com')
  console.log('     Şifre: garson123')
}

resetTestUsers().catch(console.error)