import { requireRole } from '@/lib/auth'
import WaitersList from '@/components/admin/WaitersList'

export default async function WaitersPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Garsonlar</h2>
      <WaitersList />
    </div>
  )
}
