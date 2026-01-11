import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Bu endpoint test kullanıcılarını oluşturur
 * NOT: Bu route'u sadece development ortamında kullanın!
 * Service Role Key gerektirir (SUPABASE_SERVICE_ROLE_KEY)
 */

// CORS headers helper
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 200 }))
}

export async function POST() {
  // Sadece development ortamında çalışsın
  if (process.env.NODE_ENV === 'production') {
    const response = NextResponse.json(
      { error: 'Bu endpoint sadece development ortamında çalışır' },
      { status: 403 }
    )
    return addCorsHeaders(response)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    const response = NextResponse.json(
      { error: 'Supabase URL veya Service Role Key bulunamadı. .env.local dosyanızı kontrol edin.' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }

  // Admin client oluştur (Service Role Key ile)
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

  const results = []

  for (const user of testUsers) {
    try {
      // Kullanıcıyı Auth'a ekle
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true // Email doğrulamasını atla
      })

      if (authError) {
        // Kullanıcı zaten varsa, onu al
        if (authError.message.includes('already registered')) {
          const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
          const foundUser = existingUser?.users.find(u => u.email === user.email)
          
          if (foundUser) {
            // Profil oluştur
            const { error: profileError } = await supabaseAdmin
              .from('users')
              .upsert({
                id: foundUser.id,
                name: user.name,
                role: user.role
              })

            if (profileError) {
              results.push({
                email: user.email,
                status: 'error',
                message: `Profil oluşturulurken hata: ${profileError.message}`
              })
            } else {
              results.push({
                email: user.email,
                status: 'updated',
                message: 'Kullanıcı zaten vardı, profil güncellendi'
              })
            }
            continue
          }
        }
        
        results.push({
          email: user.email,
          status: 'error',
          message: `Auth hatası: ${authError.message}`
        })
        continue
      }

      if (!authData.user) {
        results.push({
          email: user.email,
          status: 'error',
          message: 'Kullanıcı oluşturulamadı'
        })
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
        results.push({
          email: user.email,
          status: 'error',
          message: `Profil oluşturulurken hata: ${profileError.message}`
        })
      } else {
        results.push({
          email: user.email,
          status: 'success',
          message: 'Kullanıcı başarıyla oluşturuldu'
        })
      }
    } catch (error: any) {
      results.push({
        email: user.email,
        status: 'error',
        message: `Beklenmeyen hata: ${error.message}`
      })
    }
  }

  const response = NextResponse.json({
    message: 'Test kullanıcıları oluşturuldu',
    results,
    credentials: {
      admin: {
        email: 'admin@test.com',
        password: 'admin123'
      },
      waiter: {
        email: 'garson@test.com',
        password: 'garson123'
      }
    }
  })
  return addCorsHeaders(response)
}