import { createServerClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = createServerClient()
  const user = await getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile as { role: 'admin' | 'waiter'; name: string; id: string; restaurant_id: string } | null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

export async function requireRole(role: 'admin' | 'waiter') {
  const profile = await getUserProfile()
  if (!profile || profile.role !== role) {
    redirect('/login')
  }
  
  // Ensure user has a restaurant_id
  if (!profile.restaurant_id) {
    console.error('User has no restaurant_id, redirecting to login')
    redirect('/login')
  }
  
  return profile
}
