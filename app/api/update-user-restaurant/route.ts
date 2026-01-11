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

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, restaurantId } = body

    if (!userId || !restaurantId) {
      const response = NextResponse.json(
        { error: 'User ID ve Restaurant ID gerekli' },
        { status: 400 }
      )
      return addCorsHeaders(response)
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ restaurant_id: restaurantId })
      .eq('id', userId)

    if (error) {
      const response = NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ success: true })
    return addCorsHeaders(response)
  } catch (error: any) {
    const response = NextResponse.json(
      { error: error.message || 'Bir hata oluştu' },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}
