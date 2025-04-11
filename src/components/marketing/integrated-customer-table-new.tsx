'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Customer } from '@prisma/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Pencil, Trash2, MessageSquare, Send, MoreHorizontal } from 'lucide-react'
import { CustomerFormDialogNew } from './customer-form-dialog-new'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/utils'

type CustomerWithFormatting = Customer & {
  formattedPhone: string
  whatsappStatus?: string
  lastMessageAt?: Date | null
  tags?: string[]
}

interface IntegratedCustomerTableProps {
  showWhatsappStatus?: boolean
}

async function getCustomers(): Promise<CustomerWithFormatting[]> {
  try {
    const res = await fetch('/api/marketing/customers-new', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch customers')
    
    const customers = await res.json()
    return customers.map((customer: Customer) => ({
      ...customer,
      // Format phone number for display - add 62 prefix if needed
      formattedPhone: customer.phone ? `62${customer.phone}` : '',
      whatsappStatus: customer.status || 'UNVERIFIED',
      lastMessageAt: null,
      tags: []
    }))
  } catch (error) {
    console.error('Error loading customers:', error)
    return []
  }
}

// Helper function to render WhatsApp status badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    VERIFIED: { label: "Verified", className: "bg-green-100 text-green-800" },
    UNVERIFIED: { label: "Unverified", className: "bg-yellow-100 text-yellow-800" },
    INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
    BLOCKED: { label: "Blocked", className: "bg-red-100 text-red-800" },
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNVERIFIED

  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  )
}

export function IntegratedCustomerTable({ showWhatsappStatus = true }: IntegratedCustomerTableProps) {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerWithFormatting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Load customers on component mount
  useEffect(() => {
    const loadCustomers = async () => {
      setIsLoading(true)
      const data = await getCustomers()
      
      // Simulate WhatsApp data for demo
      const enrichedData = data.map(customer => ({
        ...customer,
        whatsappStatus: customer.status || Math.random() > 0.7 ? 'VERIFIED' : 'UNVERIFIED',
        lastMessageAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        tags: Math.random() > 0.5 ? ['Customer'] : []
      }))
      
      setCustomers(enrichedData)
      setIsLoading(false)
    }
    
    loadCustomers()
  }, [])
  
  // Filter customers based on search term only
  const filteredCustomers = customers.filter(customer => {
    return (
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.formattedPhone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  })
  
  // Handle opening WhatsApp chat
  const handleWhatsAppClick = (phone: string) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This customer doesn't have a phone number.",
        variant: "destructive"
      })
      return
    }
    
    // Format phone number for WhatsApp API
    const formattedPhone = phone.startsWith('62') ? phone : `62${phone}`
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, '_blank')
  }
  
  // Handle send message through API
  const handleSendMessage = (customerId: string) => {
    router.push(`/marketing/whatsapp/message-send?contact=${customerId}`)
  }
  
  // Handle customer edit
  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsDialogOpen(true)
  }
  
  // Handle customer delete
  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const res = await fetch(`/api/marketing/customers-new/${id}`, {
          method: 'DELETE',
        })
        
        if (!res.ok) throw new Error('Failed to delete customer')
        
        // Remove customer from state
        setCustomers(customers.filter(c => c.id !== id))
        
        toast({
          title: "Customer deleted",
          description: "The customer has been deleted successfully."
        })
      } catch (error) {
        console.error('Error deleting customer:', error)
        toast({
          title: "Error",
          description: "Failed to delete customer. Please try again.",
          variant: "destructive"
        })
      }
    }
  }
  
  // Handle viewing WhatsApp history
  const handleViewHistory = (customerId: string) => {
    router.push(`/marketing/whatsapp/chat?contact=${customerId}`)
  }
  
  // Handle dialog close and refresh
  const handleDialogClose = (refresh: boolean) => {
    setIsDialogOpen(false)
    setSelectedCustomer(null)
    
    if (refresh) {
      // Reload customers
      getCustomers().then(data => {
        // Simulate WhatsApp data for demo
        const enrichedData = data.map(customer => ({
          ...customer,
          whatsappStatus: customer.status || Math.random() > 0.7 ? 'VERIFIED' : 'UNVERIFIED',
          lastMessageAt: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
          tags: Math.random() > 0.5 ? ['Customer'] : []
        }))
        
        setCustomers(enrichedData)
      })
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading customers...</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.formattedPhone || 'N/A'}</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.whatsappStatus || "UNVERIFIED"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {customer.tags && customer.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.lastMessageAt
                        ? formatDate(customer.lastMessageAt)
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleWhatsAppClick(customer.phone || '')}
                          title="Open WhatsApp chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(customer)}
                          title="Edit customer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(customer.id)}
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      <CustomerFormDialogNew
        open={isDialogOpen}
        customer={selectedCustomer}
        onClose={(shouldRefresh) => {
          setIsDialogOpen(false)
          setSelectedCustomer(null)
          shouldRefresh && location.reload() // Temporary refresh until proper state management
        }}
      />
    </div>
  )
}