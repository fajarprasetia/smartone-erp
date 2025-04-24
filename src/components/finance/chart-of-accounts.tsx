"use client"

import React, { useState } from "react"
// Define interface instead of importing from Prisma
interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: string
  subtype?: string | null
  description?: string | null
  isActive: boolean
}
import { 
  Edit, 
  Plus, 
  Trash, 
  ChevronDown, 
  ChevronUp,
  FileSpreadsheet,
  Eye
} from "lucide-react"
import { format } from "date-fns"

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
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ChartOfAccountsProps {
  accounts: ChartOfAccount[]
  onAddAccount: () => void
  onEditAccount: (account: ChartOfAccount) => void
  onDeleteAccount: (account: ChartOfAccount) => void
  onViewTransactions: (account: ChartOfAccount) => void
}

export function ChartOfAccounts({
  accounts,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onViewTransactions
}: ChartOfAccountsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("code")
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

  // Group accounts by type
  const accountTypes = Array.from(new Set(accounts.map(account => account.type)))
  
  const filteredAccounts = accounts.filter(account => {
    const searchLower = searchTerm.toLowerCase()
    return (
      account.code.toLowerCase().includes(searchLower) ||
      account.name.toLowerCase().includes(searchLower) ||
      account.type.toLowerCase().includes(searchLower) ||
      (account.subtype && account.subtype.toLowerCase().includes(searchLower)) ||
      (account.description && account.description.toLowerCase().includes(searchLower))
    )
  })

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
    if (sortField === "code") {
      return sortDirection === "asc" 
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code)
    }
    
    if (sortField === "name") {
      return sortDirection === "asc" 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    }
    
    if (sortField === "type") {
      return sortDirection === "asc" 
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type)
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

  // Get accounts grouped by type
  const getAccountsByType = (type: string) => {
    return sortedAccounts.filter(account => account.type === type)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
          <span className="absolute left-3 top-2.5 text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
        </div>
        <Button onClick={onAddAccount}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {searchTerm ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="code">Account Code</SortableHeader>
                <SortableHeader field="name">Account Name</SortableHeader>
                <SortableHeader field="type">Type</SortableHeader>
                <TableHead>Subtype</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No accounts found
                  </TableCell>
                </TableRow>
              ) : (
                sortedAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell>{account.subtype || '-'}</TableCell>
                    <TableCell>{account.description || '-'}</TableCell>
                    <TableCell>
                      {account.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewTransactions(account)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onEditAccount(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteAccount(account)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {accountTypes.map((type) => (
            <AccordionItem key={type} value={type}>
              <AccordionTrigger className="font-bold text-lg">
                {type} Accounts
              </AccordionTrigger>
              <AccordionContent>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Subtype</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAccountsByType(type).map((account) => (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">{account.code}</TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>{account.subtype || '-'}</TableCell>
                          <TableCell>{account.description || '-'}</TableCell>
                          <TableCell>
                            {account.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => onViewTransactions(account)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onEditAccount(account)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onDeleteAccount(account)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
} 