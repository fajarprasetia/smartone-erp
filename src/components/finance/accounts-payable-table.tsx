"use client"

import React, { useState } from "react"
import { 
  ArrowDownIcon,
  ChevronDown, 
  ChevronUp, 
  DownloadIcon, 
  EyeIcon, 
  FileTextIcon, 
  UploadIcon 
} from "lucide-react"
import { format } from "date-fns"

// Define interfaces instead of importing from Prisma
interface Bill {
  id: string
  billNumber: string
  amount: number
  paidAmount: number
  dueDate: Date | string
  status: string
  reference?: string | null
}

interface Vendor {
  id: string
  name: string
}

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

type BillWithVendor = Bill & {
  vendor: Vendor
  attachment?: string | null
}

interface AccountsPayableTableProps {
  bills: BillWithVendor[]
  onViewBill: (bill: BillWithVendor) => void
  onDownloadBill: (bill: BillWithVendor) => void
  onRecordPayment: (bill: BillWithVendor) => void
  onUploadAttachment: (bill: BillWithVendor) => void
}

export function AccountsPayableTable({
  bills,
  onViewBill,
  onDownloadBill,
  onRecordPayment,
  onUploadAttachment
}: AccountsPayableTableProps) {
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

  const sortedBills = [...bills].sort((a, b) => {
    if (sortField === "billNumber") {
      return sortDirection === "asc" 
        ? a.billNumber.localeCompare(b.billNumber)
        : b.billNumber.localeCompare(a.billNumber)
    }
    
    if (sortField === "vendorName") {
      return sortDirection === "asc" 
        ? a.vendor.name.localeCompare(b.vendor.name)
        : b.vendor.name.localeCompare(a.vendor.name)
    }
    
    if (sortField === "amount") {
      return sortDirection === "asc" 
        ? a.amount - b.amount
        : b.amount - a.amount
    }
    
    if (sortField === "balanceDue") {
      const aBalance = a.amount - a.paidAmount
      const bBalance = b.amount - b.paidAmount
      return sortDirection === "asc" 
        ? aBalance - bBalance
        : bBalance - aBalance
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

  const getStatusBadge = (bill: BillWithVendor) => {
    const today = new Date()
    const dueDate = new Date(bill.dueDate)
    const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const balanceDue = bill.amount - bill.paidAmount
    
    if (bill.status === "PAID") {
      return <Badge className="bg-green-500">Paid</Badge>
    }
    
    if (balanceDue === 0) {
      return <Badge className="bg-green-500">Paid</Badge>
    }
    
    if (daysDiff < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    
    if (daysDiff <= 7) {
      return <Badge className="bg-yellow-500">Due Soon</Badge>
    }
    
    return <Badge variant="outline">Unpaid</Badge>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="billNumber">Bill #</SortableHeader>
            <SortableHeader field="vendorName">Vendor</SortableHeader>
            <TableHead>Reference</TableHead>
            <SortableHeader field="dueDate">Due Date</SortableHeader>
            <SortableHeader field="amount">Total</SortableHeader>
            <SortableHeader field="balanceDue">Balance Due</SortableHeader>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedBills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24">
                No bills found
              </TableCell>
            </TableRow>
          ) : (
            sortedBills.map((bill) => {
              const balanceDue = bill.amount - bill.paidAmount
              return (
                <TableRow key={bill.id} className={cn(
                  balanceDue > 0 && new Date(bill.dueDate) < new Date() ? "bg-red-50 dark:bg-red-950/20" : ""
                )}>
                  <TableCell className="font-medium">{bill.billNumber}</TableCell>
                  <TableCell>{bill.vendor.name}</TableCell>
                  <TableCell>{bill.reference || '-'}</TableCell>
                  <TableCell>{format(new Date(bill.dueDate), "dd MMM yyyy")}</TableCell>
                  <TableCell>{formatCurrency(bill.amount)}</TableCell>
                  <TableCell>{formatCurrency(balanceDue)}</TableCell>
                  <TableCell>{getStatusBadge(bill)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <EyeIcon className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewBill(bill)}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Bill
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownloadBill(bill)}>
                          <DownloadIcon className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {balanceDue > 0 && (
                          <DropdownMenuItem onClick={() => onRecordPayment(bill)}>
                            <ArrowDownIcon className="h-4 w-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onUploadAttachment(bill)}>
                          <UploadIcon className="h-4 w-4 mr-2" />
                          Upload Attachment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
} 