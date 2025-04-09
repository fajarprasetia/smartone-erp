import { getOrderById } from '@/lib/actions/orders'
import ViewOrderData from '@/components/view-order'

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const order = await getOrderById(params.id)

  if (!order) return <div>Order not found</div>

  return (
    <div className="container mx-auto py-8">
      <ViewOrderData order={order} />
    </div>
  )
}