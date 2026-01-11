import { requireRole } from '@/lib/auth'
import TablesDashboard from '@/components/admin/TablesDashboard'

export default async function AdminPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Masa Takibi</h2>
      <TablesDashboard />
    </div>
  )
}
