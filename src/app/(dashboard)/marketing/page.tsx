import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquarePlus, MessageSquareReply, Users } from 'lucide-react'
import Link from 'next/link'

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold tracking-tight">Marketing Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/marketing/customer">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Management</CardTitle>
              <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Customers</div>
              <p className="text-xs text-muted-foreground">Manage customer information and contacts</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/marketing/customer-new">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customer Management</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Customers (New)</div>
              <p className="text-xs text-muted-foreground">Updated customer management with proper schema</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/marketing/whatsapp">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp Management</CardTitle>
              <MessageSquareReply className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">WhatsApp</div>
              <p className="text-xs text-muted-foreground">Chat with customers and send blast messages</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}