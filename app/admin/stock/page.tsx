import { requireRole } from '@/lib/auth'
import StockManagement from '@/components/admin/StockManagement'

export default async function StockPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Stok Yönetimi</h2>
      <StockManagement />
    </div>
  )
}
