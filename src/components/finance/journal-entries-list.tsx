"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Edit, Trash, Search, FilterX, PlusCircle, FileText, X, ChevronDown, CheckCircle } from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface JournalEntryItem {
  id: string
  journalEntryId: string
  accountId: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
}

interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  periodId: string
  periodName: string
  description?: string
  reference?: string
  status: "DRAFT" | "POSTED" | "VOIDED"
  createdAt: string
  updatedAt: string
  items: JournalEntryItem[]
}

interface PaginationData {
  totalCount: number
  totalPages: number
  currentPage: number
  pageSize: number
}

interface FiltersData {
  periods: string[]
  statuses: string[]
}

interface JournalEntriesListProps {
  onAddEntry: () => void
  onEditEntry: (entry: JournalEntry) => void
}

export function JournalEntriesList({ onAddEntry, onEditEntry }: JournalEntriesListProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    pageSize: 25,
  })
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([])
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [isPostingEntry, setIsPostingEntry] = useState(false)
  const [entryToPost, setEntryToPost] = useState<JournalEntry | null>(null)
  const [isConfirmPostOpen, setIsConfirmPostOpen] = useState(false)

  useEffect(() => {
    fetchJournalEntries()
  }, [searchQuery, selectedPeriod, selectedStatus, pagination.currentPage, pagination.pageSize, sortBy, sortDirection])

  const fetchJournalEntries = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      
      if (searchQuery) {
        queryParams.set("search", searchQuery)
      }
      
      if (selectedPeriod) {
        queryParams.set("period", selectedPeriod)
      }

      if (selectedStatus) {
        queryParams.set("status", selectedStatus)
      }
      
      queryParams.set("page", pagination.currentPage.toString())
      queryParams.set("pageSize", pagination.pageSize.toString())
      queryParams.set("sortBy", sortBy)
      queryParams.set("sortDirection", sortDirection)
      
      const response = await fetch(`/api/finance/ledger/journal-entries?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch journal entries")
      }
      
      const data = await response.json()
      setEntries(data.entries)
      setPagination(data.pagination)
      setAvailablePeriods(data.filters.periods)
      setAvailableStatuses(data.filters.statuses)
    } catch (error) {
      console.error("Error fetching journal entries:", error)
      toast.error("Failed to load journal entries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/finance/ledger/journal-entries?id=${entryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete journal entry")
      }

      await fetchJournalEntries()
      toast.success("Journal entry deleted successfully")
      setIsConfirmDeleteOpen(false)
      setEntryToDelete(null)
    } catch (error) {
      console.error("Error deleting journal entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete journal entry")
    }
  }

  const handlePostEntry = async () => {
    if (!entryToPost) return

    try {
      setIsPostingEntry(true)
      const response = await fetch(`/api/finance/ledger/journal-entries/post?id=${entryToPost.id}`, {
        method: "PUT",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to post journal entry")
      }

      await fetchJournalEntries()
      toast.success("Journal entry posted successfully")
      setIsConfirmPostOpen(false)
      setEntryToPost(null)
    } catch (error) {
      console.error("Error posting journal entry:", error)
      toast.error(error instanceof Error ? error.message : "Failed to post journal entry")
    } finally {
      setIsPostingEntry(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortDirection("desc")
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

  const handlePeriodFilter = (period: string) => {
    const filterPeriod = period === "all" ? null : period;
    setSelectedPeriod(filterPeriod);
    setPagination({
      ...pagination,
      currentPage: 1,
    });
  }

  const handleStatusFilter = (status: string) => {
    const filterStatus = status === "all" ? null : status;
    setSelectedStatus(filterStatus);
    setPagination({
      ...pagination,
      currentPage: 1,
    });
  }

  const toggleExpandEntry = (entryId: string) => {
    const newExpandedEntries = new Set(expandedEntries)
    if (newExpandedEntries.has(entryId)) {
      newExpandedEntries.delete(entryId)
    } else {
      newExpandedEntries.add(entryId)
    }
    setExpandedEntries(newExpandedEntries)
  }

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null
    return sortDirection === "asc" ? "↑" : "↓"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy")
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Journal Entries</CardTitle>
            <CardDescription>
              View and manage your journal entries
            </CardDescription>
          </div>
          <Button onClick={onAddEntry}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4 gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search entries..."
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
            value={selectedPeriod || "all"}
            onValueChange={(value) => handlePeriodFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              {availablePeriods.map((period) => (
                <SelectItem key={period} value={period}>
                  {period}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedStatus || "all"}
            onValueChange={(value) => handleStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
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
                <TableHead className="w-[40px]"></TableHead>
                <TableHead onClick={() => handleSort("entryNumber")} className="cursor-pointer">
                  Entry # {getSortIcon("entryNumber")}
                </TableHead>
                <TableHead onClick={() => handleSort("date")} className="cursor-pointer">
                  Date {getSortIcon("date")}
                </TableHead>
                <TableHead onClick={() => handleSort("description")} className="cursor-pointer">
                  Description {getSortIcon("description")}
                </TableHead>
                <TableHead onClick={() => handleSort("periodName")} className="cursor-pointer">
                  Period {getSortIcon("periodName")}
                </TableHead>
                <TableHead className="text-right">Debit / Credit</TableHead>
                <TableHead onClick={() => handleSort("status")} className="cursor-pointer">
                  Status {getSortIcon("status")}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    Loading journal entries...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    No journal entries found.
                    {(searchQuery || selectedPeriod || selectedStatus) && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("")
                          setSelectedPeriod(null)
                          setSelectedStatus(null)
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <>
                    <TableRow key={entry.id} className="group">
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 opacity-70"
                          onClick={() => toggleExpandEntry(entry.id)}
                        >
                          <ChevronDown className={cn(
                            "h-4 w-4 transition-transform",
                            expandedEntries.has(entry.id) ? "rotate-180" : "rotate-0"
                          )} />
                          <span className="sr-only">Toggle details</span>
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {entry.description || "-"}
                      </TableCell>
                      <TableCell>{entry.periodName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(entry.items.reduce((sum, item) => sum + item.debit, 0))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn({
                            "bg-green-50 text-green-700 border-green-200":
                              entry.status === "POSTED",
                            "bg-amber-50 text-amber-700 border-amber-200":
                              entry.status === "DRAFT",
                            "bg-red-50 text-red-700 border-red-200":
                              entry.status === "VOIDED",
                          })}
                        >
                          {entry.status}
                        </Badge>
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
                            {entry.status === "DRAFT" && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setEntryToPost(entry)
                                  setIsConfirmPostOpen(true)
                                }}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                Post Entry
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onEditEntry(entry)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              // View detailed entry
                            }}>
                              <FileText className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {entry.status !== "POSTED" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setEntryToDelete(entry)
                                    setIsConfirmDeleteOpen(true)
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete Entry
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedEntries.has(entry.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-slate-50 py-2 px-4">
                          <div className="py-2">
                            <h4 className="font-medium mb-2">Entry Details</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Account</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">Debit</TableHead>
                                  <TableHead className="text-right">Credit</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entry.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      <div>
                                        <span className="font-mono">{item.accountCode}</span>
                                        <span className="block text-xs text-muted-foreground">
                                          {item.accountName}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell>{item.description || "-"}</TableCell>
                                    <TableCell className="text-right font-mono">
                                      {item.debit > 0 ? formatCurrency(item.debit) : ""}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {item.credit > 0 ? formatCurrency(item.credit) : ""}
                                    </TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="border-t-2">
                                  <TableCell colSpan={2} className="font-bold text-right">Total</TableCell>
                                  <TableCell className="font-bold text-right font-mono">
                                    {formatCurrency(entry.items.reduce((sum, item) => sum + item.debit, 0))}
                                  </TableCell>
                                  <TableCell className="font-bold text-right font-mono">
                                    {formatCurrency(entry.items.reduce((sum, item) => sum + item.credit, 0))}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Showing {entries.length} of {pagination.totalCount} entries
        </div>
        {renderPagination()}
      </CardFooter>

      <AlertDialog
        open={isConfirmPostOpen}
        onOpenChange={setIsConfirmPostOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post journal entry{" "}
              <span className="font-medium">
                {entryToPost?.entryNumber}
              </span>?
              <br />
              <br />
              <strong className="text-amber-600">Warning:</strong> Posted journal entries cannot be edited or deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPostingEntry}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePostEntry}
              className="bg-green-600 hover:bg-green-700"
              disabled={isPostingEntry}
            >
              {isPostingEntry ? "Posting..." : "Post Entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isConfirmDeleteOpen}
        onOpenChange={setIsConfirmDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the journal entry{" "}
              <span className="font-medium">
                {entryToDelete?.entryNumber}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 