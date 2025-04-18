import { Tabs, TabsList as TabList, TabsTrigger as TabTrigger, TabsContent as TabContent } from '@/components/ui/tabs'
import { OrderTable } from '@/components/order-table'
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
      
      <Tabs defaultValue="pending" className="w-full">
        <TabList className="bg-transparent border-b border-border w-full">
          <TabTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none" value="pending">Pending Approvals</TabTrigger>
          <TabTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none" value="approved">Approved</TabTrigger>
          <TabTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none" value="rejects">Rejects</TabTrigger>
        </TabList>
        
        <TabContent value="pending">
          <OrderTable 
            approvalStatus="pending"
            role={role}
            showActions
          />
        </TabContent>

        <TabContent value="approved">
          <OrderTable 
            approvalStatus="approved"
            role={role}
            showStatus
          />
        </TabContent>

        <TabContent value="rejects">
          <Tabs defaultValue="pending-rejects" className="w-full">
            <TabList className="bg-transparent border-b border-border w-full">
              <TabTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none" value="pending-rejects">Pending Approval</TabTrigger>
              <TabTrigger className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none" value="approved-rejects">Approved</TabTrigger>
            </TabList>
            
            <TabContent value="pending-rejects">
              <OrderTable
                rejectionStatus="pending"
                role={role}
                showRejectActions
              />
            </TabContent>

            <TabContent value="approved-rejects">
              <OrderTable
                rejectionStatus="approved"
                role={role}
              />
            </TabContent>
          </Tabs>
        </TabContent>
      </Tabs>
    </div>
  )
}