import { OrderTable } from '@/components/manager/approval-table'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function ManagerPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold tracking-tight">Manager Approvals</h2>
      </div>
      
      <OrderTable 
        approvalStatus="pending"
        role={role}
        showActions
      />
    </div>
  )
}