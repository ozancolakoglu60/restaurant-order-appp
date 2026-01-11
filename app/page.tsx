import { redirect } from 'next/navigation'
import { getSession, getUserProfile } from '@/lib/auth'

export default async function Home() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const profile = await getUserProfile()
  
  if (profile?.role === 'admin') {
    redirect('/admin')
  } else if (profile?.role === 'waiter') {
    redirect('/waiter')
  }

  redirect('/login')
}
