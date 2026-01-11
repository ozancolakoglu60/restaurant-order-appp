import { requireRole } from '@/lib/auth'
import OrdersList from '@/components/admin/OrdersList'

export default async function OrdersPage() {
  await requireRole('admin')

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Siparişler</h2>
      <OrdersList />
    </div>
  )
}
