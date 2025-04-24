"use client"

import React, { useState } from "react"
import { 
  ChevronDown, 
  ChevronUp, 
  DownloadIcon, 
  EyeIcon, 
  FileTextIcon, 
  SendIcon 
} from "lucide-react"
import { format } from "date-fns"
import { Invoice, customer } from "@prisma/client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { cn, formatCurrency } from "@/lib/utils"

type InvoiceWithCustomer = Invoice & {
  customer: customer
  order?: {
    spk: string | null
  } | null
}

interface AccountsReceivableTableProps {
  invoices: InvoiceWithCustomer[]
  onViewInvoice: (invoice: InvoiceWithCustomer) => void
  onSendReminder: (invoice: InvoiceWithCustomer) => void
  onDownloadInvoice: (invoice: InvoiceWithCustomer) => void
  onRecordPayment: (invoice: InvoiceWithCustomer) => void
}

export function AccountsReceivableTable({
  invoices,
  onViewInvoice,
  onSendReminder,
  onDownloadInvoice,
  onRecordPayment
}: AccountsReceivableTableProps) {
  const [sortField, setSortField] = useState<string>("dueDate")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (sortField === "invoiceNumber") {
      return sortDirection === "asc" 
        ? a.invoiceNumber.localeCompare(b.invoiceNumber)
        : b.invoiceNumber.localeCompare(a.invoiceNumber)
    }
    
    if (sortField === "customerName") {
      return sortDirection === "asc" 
        ? a.customer.nama.localeCompare(b.customer.nama)
        : b.customer.nama.localeCompare(a.customer.nama)
    }
    
    if (sortField === "total") {
      return sortDirection === "asc" 
        ? a.total - b.total
        : b.total - a.total
    }
    
    if (sortField === "balance") {
      return sortDirection === "asc" 
        ? a.balance - b.balance
        : b.balance - a.balance
    }
    
    if (sortField === "dueDate") {
      return sortDirection === "asc" 
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    }
    
    return 0
  })

  const SortableHeader = ({ field, children }: { field: string, children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  )

  const getStatusBadge = (invoice: InvoiceWithCustomer) => {
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (invoice.status === "PAID") {
      return <Badge variant="success">Paid</Badge>
    }
    
    if (daysDiff < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    
    if (daysDiff <= 7) {
      return <Badge variant="warning">Due Soon</Badge>
    }
    
    return <Badge variant="outline">Outstanding</Badge>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="invoiceNumber">Invoice #</SortableHeader>
            <SortableHeader field="customerName">Customer</SortableHeader>
            <TableHead>Order Reference</TableHead>
            <SortableHeader field="dueDate">Due Date</SortableHeader>
            <SortableHeader field="total">Total</SortableHeader>
            <SortableHeader field="balance">Balance</SortableHeader>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedInvoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24">
                No outstanding invoices found
              </TableCell>
            </TableRow>
          ) : (
            sortedInvoices.map((invoice) => (
              <TableRow key={invoice.id} className={cn(
                invoice.balance > 0 && new Date(invoice.dueDate) < new Date() ? "bg-red-50 dark:bg-red-950/20" : ""
              )}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.customer.nama}</TableCell>
                <TableCell>{invoice.order?.spk || '-'}</TableCell>
                <TableCell>{format(new Date(invoice.dueDate), "dd MMM yyyy")}</TableCell>
                <TableCell>{formatCurrency(invoice.total)}</TableCell>
                <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                <TableCell>{getStatusBadge(invoice)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewInvoice(invoice)}>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendReminder(invoice)}>
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Reminder
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDownloadInvoice(invoice)}>
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </DropdownMenuItem>
                      {invoice.balance > 0 && (
                        <DropdownMenuItem onClick={() => onRecordPayment(invoice)}>
                          <FileTextIcon className="h-4 w-4 mr-2" />
                          Record Payment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 