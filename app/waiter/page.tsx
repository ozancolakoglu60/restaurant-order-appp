import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import TablesList from '@/components/waiter/TablesList'

export default async function WaiterPage() {
  await requireRole('waiter')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Masalar</h2>
      <TablesList />
    </div>
  )
}
