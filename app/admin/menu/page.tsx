import { requireRole } from '@/lib/auth'
import MenuManagement from '@/components/admin/MenuManagement'

export default async function MenuPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Menü Yönetimi</h2>
      <MenuManagement />
    </div>
  )
}
