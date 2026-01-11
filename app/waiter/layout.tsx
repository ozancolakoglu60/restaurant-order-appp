import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'

export default async function WaiterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole('waiter')
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get restaurant name
  let restaurantName = ''
  if (profile.restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', profile.restaurant_id)
      .single()
    
    if (restaurant) {
      restaurantName = (restaurant as { name: string }).name
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center min-h-[60px] sm:h-20 py-2">
            <div className="flex flex-col">
              {restaurantName && (
                <h1 className="text-base sm:text-xl font-bold text-gray-900">
                  {restaurantName}
                </h1>
              )}
              <p className="text-sm text-gray-600 mt-0.5">
                {profile.name}
              </p>
            </div>
            <div className="flex items-center">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
    </div>
  )
}
