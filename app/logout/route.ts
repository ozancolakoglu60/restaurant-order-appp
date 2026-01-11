import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}
