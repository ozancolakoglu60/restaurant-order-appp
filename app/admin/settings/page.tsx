import { requireRole } from '@/lib/auth'
import RestaurantSettings from '@/components/admin/RestaurantSettings'

export default async function SettingsPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Restoran Ayarları</h2>
      <RestaurantSettings />
    </div>
  )
}
