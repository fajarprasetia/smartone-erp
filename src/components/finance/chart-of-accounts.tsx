"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Edit, Plus, Search, Trash, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ChartOfAccount {
  id: string
  code: string
  name: string
  type: string
  subtype: string | null
  description: string | null
  isActive: boolean
  balance: number
  createdAt: string
  updatedAt: string
}

interface PaginationData {
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

interface FiltersData {
  types: string[]
}

const accountTypeOptions = [
  "Asset",
  "Liability",
  "Equity",
  "Revenue",
  "Expense",
]

const formSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  type: z.string().min(1, "Account type is required"),
  subtype: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  balance: z.preprocess(
    (val) => (val === "" ? 0 : Number(val)),
    z.number().default(0)
  ),
})

type FormValues = z.infer<typeof formSchema>

export function ChartOfAccounts() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 25,
  })
  const [availableTypes, setAvailableTypes] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ChartOfAccount | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<ChartOfAccount | null>(null)
  const [sortBy, setSortBy] = useState("code")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "",
      subtype: "",
      description: "",
      isActive: true,
      balance: 0,
    },
  })

  useEffect(() => {
    fetchAccounts()
  }, [searchQuery, selectedType, pagination.currentPage, pagination.pageSize, sortBy, sortDirection])

  const fetchAccounts = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      
      if (searchQuery) {
        queryParams.set("search", searchQuery)
      }
      
      if (selectedType) {
        queryParams.set("type", selectedType)
      }
      
      queryParams.set("page", pagination.currentPage.toString())
      queryParams.set("pageSize", pagination.pageSize.toString())
      queryParams.set("sortBy", sortBy)
      queryParams.set("sortDirection", sortDirection)
      
      const response = await fetch(`/api/finance/chart-of-accounts?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch accounts")
      }
      
      const data = await response.json()
      setAccounts(data.accounts)
      setPagination(data.pagination)
      setAvailableTypes(data.filters.types)
    } catch (error) {
      console.error("Error fetching accounts:", error)
      toast.error("Failed to load accounts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAccount = async (values: FormValues) => {
    try {
      const response = await fetch("/api/finance/chart-of-accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create account")
      }

      await fetchAccounts()
      toast.success("Account created successfully")
      setIsDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error("Error creating account:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create account")
    }
  }

  const handleUpdateAccount = async (values: FormValues) => {
    if (!editingAccount) return

    try {
      const response = await fetch(`/api/finance/chart-of-accounts?id=${editingAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update account")
      }

      await fetchAccounts()
      toast.success("Account updated successfully")
      setIsDialogOpen(false)
      setEditingAccount(null)
      form.reset()
    } catch (error) {
      console.error("Error updating account:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update account")
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return

    try {
      const response = await fetch(`/api/finance/chart-of-accounts?id=${accountToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete account")
      }

      await fetchAccounts()
      toast.success("Account deleted successfully")
      setIsConfirmDeleteOpen(false)
      setAccountToDelete(null)
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete account")
    }
  }

  const openEditDialog = (account: ChartOfAccount) => {
    setEditingAccount(account)
    form.reset({
      code: account.code,
      name: account.name,
      type: account.type,
      subtype: account.subtype || "",
      description: account.description || "",
      isActive: account.isActive,
      balance: account.balance,
    })
    setIsDialogOpen(true)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page: number) => {
    setPagination({
      ...pagination,
      currentPage: page,
    })
  }

  const handlePageSizeChange = (size: number) => {
    setPagination({
      ...pagination,
      pageSize: size,
      currentPage: 1,
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setPagination({
      ...pagination,
      currentPage: 1,
    })
  }

  const handleTypeFilter = (type: string) => {
    // Convert "all" type to null for filtering logic
    const filterType = type === "all" ? null : type;
    setSelectedType(filterType);
    setPagination({
      ...pagination,
      currentPage: 1,
    });
  }

  const resetForm = () => {
    form.reset()
    setEditingAccount(null)
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  const renderPagination = () => {
    const { totalPages, currentPage } = pagination
    if (totalPages <= 1) return null

    const pageItems = []
    const maxPagesToShow = 5
    
    // Always show first page
    pageItems.push(
      <PaginationItem key="first">
        <PaginationLink
          variant="outline"
          isActive={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Calculate start and end pages to show
    let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3)
    
    // Adjust start page if end page is at maximum
    if (endPage === totalPages - 1) {
      startPage = Math.max(2, endPage - (maxPagesToShow - 3))
    }
    
    // Add ellipsis after first page if needed
    if (startPage > 2) {
      pageItems.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }
    
    // Add pages
    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink
            variant="outline"
            isActive={currentPage === i}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      pageItems.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      )
    }
    
    // Always show last page if there are more than 1 page
    if (totalPages > 1) {
      pageItems.push(
        <PaginationItem key="last">
          <PaginationLink
            variant="outline"
            isActive={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              variant="outline"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {pageItems}
          <PaginationItem>
            <PaginationNext 
              variant="outline"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>
                Manage your financial accounts structure
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    resetForm()
                    setIsDialogOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? "Edit Account" : "Create New Account"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAccount
                      ? "Update the account details below"
                      : "Fill in the account details below"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(
                      editingAccount ? handleUpdateAccount : handleCreateAccount
                    )}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Cash" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accountTypeOptions.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subtype"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subtype (Optional)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. Current Asset"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter account description"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Active</FormLabel>
                              <FormDescription>
                                Inactive accounts are hidden from transactions
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {editingAccount && (
                        <FormField
                          control={form.control}
                          name="balance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Balance</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseFloat(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormDescription>
                                Current account balance
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <DialogFooter className="pt-4">
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {editingAccount ? "Update Account" : "Create Account"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
                type="search"
            placeholder="Search accounts..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Select
              value={selectedType || "all"}
              onValueChange={(value) => handleTypeFilter(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => handlePageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
      </div>

          <ScrollArea className="h-[460px]">
          <Table>
            <TableHeader>
              <TableRow>
                  <TableHead onClick={() => handleSort("code")} className="cursor-pointer">
                    Code {getSortIcon("code")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                    Name {getSortIcon("name")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("type")} className="cursor-pointer">
                    Type {getSortIcon("type")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("subtype")} className="cursor-pointer">
                    Subtype {getSortIcon("subtype")}
                  </TableHead>
                  <TableHead onClick={() => handleSort("balance")} className="cursor-pointer text-right">
                    Balance {getSortIcon("balance")}
                  </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Loading accounts...
                    </TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No accounts found.
                      {(searchQuery || selectedType) && (
                        <Button
                          variant="link"
                          onClick={() => {
                            setSearchQuery("")
                            setSelectedType(null)
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                        <TableRow key={account.id}>
                      <TableCell className="font-mono">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                          <TableCell>
                        <Badge
                          variant="outline"
                          className={cn({
                            "bg-green-50 text-green-700 border-green-200":
                              account.type === "Asset",
                            "bg-red-50 text-red-700 border-red-200":
                              account.type === "Liability",
                            "bg-blue-50 text-blue-700 border-blue-200":
                              account.type === "Equity",
                            "bg-purple-50 text-purple-700 border-purple-200":
                              account.type === "Revenue",
                            "bg-orange-50 text-orange-700 border-orange-200":
                              account.type === "Expense",
                          })}
                        >
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{account.subtype}</TableCell>
                      <TableCell className="text-right font-mono">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(account.balance)}
                          </TableCell>
                          <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Open menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(account)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setAccountToDelete(account)
                                setIsConfirmDeleteOpen(true)
                              }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                          </TableCell>
                        </TableRow>
                  ))
                )}
                    </TableBody>
                  </Table>
                </ScrollArea>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t px-6 py-3">
          <div className="text-xs text-muted-foreground">
            Showing {accounts.length} of {pagination.totalCount} accounts
          </div>
          {renderPagination()}
        </CardFooter>
      </Card>

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account{" "}
              <span className="font-medium">
                {accountToDelete?.code} - {accountToDelete?.name}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 