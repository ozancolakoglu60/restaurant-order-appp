import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { createServerClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/LogoutButton'
import OSLogo from '@/components/OSLogo'
import MobileSidebar from '@/components/admin/MobileSidebar'
import Link from 'next/link'
import {
  LayoutDashboard,
  Table,
  ShoppingCart,
  Utensils,
  Package,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole('admin')
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get restaurant code
  let restaurantCode = ''
  if (profile.restaurant_id) {
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('code')
      .eq('id', profile.restaurant_id)
      .single()
    
    if (restaurant) {
      restaurantCode = (restaurant as { code: string }).code
    }
  }

  const navItems = [
    { href: '/admin', label: 'Masalar', icon: Table },
    { href: '/admin/orders', label: 'Siparişler', icon: ShoppingCart },
    { href: '/admin/menu', label: 'Menü Yönetimi', icon: Utensils },
    { href: '/admin/stock', label: 'Stok Yönetimi', icon: Package },
    { href: '/admin/waiters', label: 'Garsonlar', icon: Users },
    { href: '/admin/reports', label: 'Raporlar', icon: BarChart3 },
    { href: '/admin/settings', label: 'Ayarlar', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar */}
      <MobileSidebar restaurantCode={restaurantCode} userName={profile.name} />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white shadow-lg flex-col">
        <div className="p-6 border-b">
          <div className="mb-4">
            <OSLogo size="small" />
          </div>
          {restaurantCode && (
            <p className="text-xs font-semibold text-indigo-600 mt-2 text-center">Restoran: {restaurantCode}</p>
          )}
          <p className="text-xs text-gray-600 mt-2 text-center">{profile.name}</p>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="p-3 sm:p-4 md:p-6 pt-14 lg:pt-6">{children}</div>
      </main>
    </div>
  )
}
