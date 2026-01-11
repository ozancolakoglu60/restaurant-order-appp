import { requireRole } from '@/lib/auth'
import OrderPage from '@/components/waiter/OrderPage'

export default async function TablePage({
  params,
}: {
  params: { tableId: string }
}) {
  await requireRole('waiter')

  return <OrderPage tableId={params.tableId} />
}
