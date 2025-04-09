"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  CircleCheck, 
  Clock, 
  FileText, 
  XCircle, 
  Plus, 
  Search,
  Filter,
  MoreVertical
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/utils"

// Template type definition
interface Template {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  header?: {
    format: string
    text?: string
    example?: string
  }
  body: {
    text: string
    example: string
  }
  footer?: {
    text: string
  }
}

// Mock template data
const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Welcome Message",
    description: "Sent to new customers upon registration",
    status: "APPROVED",
    createdAt: "2023-10-15T14:30:00Z",
    body: {
      text: "Hello {{1}}, welcome to SmartOne ERP! We're excited to have you on board. If you have any questions, please don't hesitate to reach out to our support team.",
      example: "Hello John, welcome to SmartOne ERP! We're excited to have you on board. If you have any questions, please don't hesitate to reach out to our support team."
    },
    footer: {
      text: "SmartOne ERP - Enhance Your Business Efficiency"
    }
  },
  {
    id: "2",
    name: "Order Confirmation",
    description: "Sent when an order is confirmed",
    status: "APPROVED",
    createdAt: "2023-11-20T09:15:00Z",
    header: {
      format: "TEXT",
      text: "Order Confirmed",
    },
    body: {
      text: "Hi {{1}}, your order #{{2}} has been confirmed and is now being processed. Estimated delivery: {{3}}. Thank you for choosing SmartOne!",
      example: "Hi Maria, your order #12345 has been confirmed and is now being processed. Estimated delivery: 24-04-2024. Thank you for choosing SmartOne!"
    },
    footer: {
      text: "For any questions about your order, please contact us."
    }
  },
  {
    id: "3",
    name: "Shipping Update",
    description: "Notifies customers about shipping status",
    status: "PENDING",
    createdAt: "2024-01-05T11:45:00Z",
    header: {
      format: "TEXT",
      text: "Shipping Update",
    },
    body: {
      text: "Hello {{1}}, your order #{{2}} has been shipped! You can track your package using the following tracking number: {{3}}. Expected delivery date: {{4}}.",
      example: "Hello Alex, your order #54321 has been shipped! You can track your package using the following tracking number: TRK987654321. Expected delivery date: 25-04-2024."
    }
  },
  {
    id: "4",
    name: "Payment Reminder",
    description: "Reminder for pending payments",
    status: "REJECTED",
    createdAt: "2024-02-10T16:20:00Z",
    body: {
      text: "Hi {{1}}, this is a friendly reminder that your payment of {{2}} for order #{{3}} is due on {{4}}. Please complete your payment to avoid any service interruptions.",
      example: "Hi Thomas, this is a friendly reminder that your payment of Rp. 2.5JT for order #67890 is due on 30-04-2024. Please complete your payment to avoid any service interruptions."
    },
    footer: {
      text: "If you've already made the payment, please disregard this message."
    }
  },
  {
    id: "5",
    name: "Feedback Request",
    description: "Request for customer feedback after delivery",
    status: "APPROVED",
    createdAt: "2024-03-25T13:10:00Z",
    header: {
      format: "TEXT",
      text: "Your Feedback Matters!",
    },
    body: {
      text: "Hello {{1}}, thank you for your recent purchase (Order #{{2}}). We'd love to hear your thoughts! Please take a moment to share your experience by clicking on the link below: {{3}}",
      example: "Hello Sarah, thank you for your recent purchase (Order #45678). We'd love to hear your thoughts! Please take a moment to share your experience by clicking on the link below: https://feedback.smartone.com/s/12345"
    },
    footer: {
      text: "Your feedback helps us improve our products and services."
    }
  }
]

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400 hover:bg-green-100 hover:dark:bg-green-800/30">
        <CircleCheck className="mr-1 h-3 w-3" />
        Approved
      </Badge>
    )
  }
  
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400 hover:bg-yellow-100 hover:dark:bg-yellow-800/30">
        <Clock className="mr-1 h-3 w-3" />
        Pending
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400 hover:bg-red-100 hover:dark:bg-red-800/30">
      <XCircle className="mr-1 h-3 w-3" />
      Rejected
    </Badge>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would fetch from an API
    setTemplates(mockTemplates)
    setLoading(false)
  }, [])

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || template.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const handleDelete = () => {
    if (!templateToDelete) return
    
    // In a real app, this would make an API call
    setTemplates(prevTemplates => 
      prevTemplates.filter(template => template.id !== templateToDelete)
    )
    
    toast.success("Template deleted successfully")
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Templates</h2>
        <p className="text-muted-foreground">
          Manage your WhatsApp message templates for automated communication.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 grow">
          <div className="relative grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search templates..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => router.push("/marketing/whatsapp/templates/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Template
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">Your Templates</CardTitle>
          <CardDescription>
            {filteredTemplates.length} template{filteredTemplates.length === 1 ? '' : 's'} found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No templates found. Try adjusting your filters or create a new template.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/marketing/whatsapp/templates/${template.id}`}
                        className="hover:underline"
                      >
                        {template.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.description}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={template.status} />
                    </TableCell>
                    <TableCell>{formatDate(template.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => router.push(`/marketing/whatsapp/templates/${template.id}`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/marketing/whatsapp/templates/${template.id}/edit`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setTemplateToDelete(template.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 