import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          if (options) {
            response.cookies.set(name, value, options)
          } else {
            response.cookies.set(name, value)
          }
        })
      },
    },
  })

  // Check if route requires authentication
  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith('/admin')
  const isWaiterRoute = pathname.startsWith('/waiter')
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  if (isAuthRoute) {
    return response
  }

  if (isAdminRoute || isWaiterRoute) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    // Get user profile and verify restaurant_id
    const { data: profile } = await supabase
      .from('users')
      .select('role, restaurant_id')
      .eq('id', session.user.id)
      .single()

    if (!profile || !profile.restaurant_id) {
      // User has no restaurant_id, force logout
      await supabase.auth.signOut()
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    // Verify role matches route
    if (isAdminRoute && profile.role !== 'admin') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    if (isWaiterRoute && profile.role !== 'waiter') {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
