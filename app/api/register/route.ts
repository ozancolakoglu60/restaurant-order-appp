import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// CORS headers için helper function
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type } = body

    let response
    if (type === 'restaurant') {
      response = await registerRestaurant(body)
    } else if (type === 'waiter') {
      response = await registerWaiter(body)
    } else {
      response = NextResponse.json(
        { error: 'Geçersiz kayıt tipi' },
        { status: 400 }
      )
    }

    // CORS headers ekle
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  } catch (error: any) {
    console.error('Registration error:', error)
    const response = NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
    
    // CORS headers ekle
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  }
}

async function registerRestaurant(body: any) {
  const { restaurantCode, restaurantName, restaurantIban, adminEmail, adminPassword, adminName } = body

  if (!restaurantCode || !restaurantName || !adminEmail || !adminPassword || !adminName) {
    return NextResponse.json(
      { error: 'Tüm zorunlu alanlar doldurulmalı' },
      { status: 400 }
    )
  }

  // Check if restaurant code already exists
  const { data: existingRestaurant } = await supabaseAdmin
    .from('restaurants')
    .select('code')
    .eq('code', restaurantCode.toUpperCase().trim())
    .single()

  if (existingRestaurant) {
    return NextResponse.json(
      { error: 'Bu restoran kodu zaten kullanılıyor' },
      { status: 400 }
    )
  }

  // Create restaurant
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .insert({
      code: restaurantCode.toUpperCase().trim(),
      name: restaurantName,
      iban: restaurantIban?.trim() || null,
    })
    .select('id')
    .single()

  if (restaurantError || !restaurant) {
    console.error('Restaurant creation error:', restaurantError)
    return NextResponse.json(
      { error: 'Restoran oluşturulamadı: ' + (restaurantError?.message || 'Bilinmeyen hata') },
      { status: 500 }
    )
  }

  // Create admin user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    // Rollback: delete restaurant if user creation fails
    await supabaseAdmin.from('restaurants').delete().eq('id', restaurant.id)
    
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı: ' + (authError?.message || 'Bilinmeyen hata') },
      { status: 500 }
    )
  }

  // Create admin profile
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      name: adminName,
      role: 'admin',
      restaurant_id: restaurant.id,
    })

  if (profileError) {
    // Rollback: delete user and restaurant
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    await supabaseAdmin.from('restaurants').delete().eq('id', restaurant.id)
    
    return NextResponse.json(
      { error: 'Profil oluşturulamadı: ' + profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Restoran ve admin kullanıcısı başarıyla oluşturuldu',
    restaurantCode: restaurantCode.toUpperCase().trim(),
  })
}

async function registerWaiter(body: any) {
  const { restaurantId, waiterEmail, waiterPassword, waiterName } = body

  if (!restaurantId || !waiterEmail || !waiterPassword || !waiterName) {
    return NextResponse.json(
      { error: 'Tüm alanlar doldurulmalı' },
      { status: 400 }
    )
  }

  // Verify restaurant exists
  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('id', restaurantId)
    .single()

  if (restaurantError || !restaurant) {
    return NextResponse.json(
      { error: 'Restoran bulunamadı' },
      { status: 400 }
    )
  }

  // Create waiter user in Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: waiterEmail,
    password: waiterPassword,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Kullanıcı oluşturulamadı: ' + (authError?.message || 'Bilinmeyen hata') },
      { status: 500 }
    )
  }

  // Create waiter profile
  const { error: profileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      name: waiterName,
      role: 'waiter',
      restaurant_id: restaurantId,
    })

  if (profileError) {
    // Rollback: delete user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    
    return NextResponse.json(
      { error: 'Profil oluşturulamadı: ' + profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Garson kullanıcısı başarıyla oluşturuldu',
  })
}
