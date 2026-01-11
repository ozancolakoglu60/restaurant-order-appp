import { requireRole } from '@/lib/auth'
import ReportsDashboard from '@/components/admin/ReportsDashboard'

export default async function ReportsPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Raporlar</h2>
      <ReportsDashboard />
    </div>
  )
}
