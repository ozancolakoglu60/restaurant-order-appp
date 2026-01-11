'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu as MenuIcon, Table, ShoppingCart, Utensils, Package, Users, BarChart3, Settings } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import OSLogo from '@/components/OSLogo'

interface MobileSidebarProps {
  restaurantCode: string
  userName: string
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

export default function MobileSidebar({ restaurantCode, userName }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-indigo-600 text-white rounded-lg shadow-lg"
        aria-label="Menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start mb-4">
                <OSLogo size="small" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {restaurantCode && (
                <p className="text-xs font-semibold text-indigo-600 mt-2 text-center">Restoran: {restaurantCode}</p>
              )}
              <p className="text-xs text-gray-600 mt-2 text-center">{userName}</p>
            </div>
            <nav className="p-4 space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
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
        </>
      )}
    </>
  )
}
