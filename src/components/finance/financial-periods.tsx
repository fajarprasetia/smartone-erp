"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  PlusIcon, 
  SearchIcon, 
  FilterIcon, 
  Edit2Icon, 
  Trash2Icon, 
  CheckCircleIcon, 
  AlertCircleIcon,
  XCircleIcon 
} from "lucide-react"
import { Pagination } from "@/components/common/pagination"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

// Interfaces
interface FinancialPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  type: string
  year: number
  quarter: number | null
  month: number | null
  status: string
  createdAt: string
}

interface PaginationData {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
}

interface FiltersData {
  type: string
  year: string
  status: string
  searchQuery: string
}

/**
 * Financial Periods Component
 * Displays and manages financial periods for accounting and reporting
 */
export default function FinancialPeriodsComponent() {
  // State management for periods data
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [periodToDelete, setPeriodToDelete] = useState<string | null>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0
  })

  // Filters state
  const [filters, setFilters] = useState<FiltersData>({
    type: "",
    year: "",
    status: "",
    searchQuery: ""
  })

  const router = useRouter()

  // Fetch periods on component mount and when filters/pagination change
  useEffect(() => {
    fetchPeriods()
  }, [pagination.currentPage, pagination.pageSize, filters, activeTab])
  
  // Fetch periods from API
  const fetchPeriods = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      
      if (filters.type) queryParams.append("type", filters.type)
      if (filters.year) queryParams.append("year", filters.year)
      if (filters.status) queryParams.append("status", filters.status)
      if (activeTab !== "all") queryParams.append("status", activeTab.toUpperCase())
      
      // Fetch data from API
      const response = await fetch(`/api/finance/periods?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch financial periods")
      }
      
      const data = await response.json()
      setPeriods(data)
      
      // Update pagination
      setPagination(prev => ({
        ...prev,
        totalItems: data.length,
        totalPages: Math.ceil(data.length / prev.pageSize)
      }))
      
    } catch (error) {
      console.error("Error fetching periods:", error)
      toast.error("Failed to load financial periods")
    } finally {
      setLoading(false)
    }
  }
  
  // Handle pagination change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }))
  }
  
  // Handle page size change
  const handlePageSizeChange = (size: string) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(size),
      currentPage: 1
    }))
  }
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value
    }))
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }))
  }
  
  // Handle type filter change
  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      type: value === "ALL" ? "" : value
    }))
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }))
  }
  
  // Handle year filter change
  const handleYearFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      year: value === "ALL" ? "" : value
    }))
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }))
  }
  
  // Handle status filter change
  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value
    }))
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }))
  }
  
  // Navigate to create new period page
  const handleCreatePeriod = () => {
    router.push("/finance/periods/create")
  }
  
  // Navigate to edit period page
  const handleEditPeriod = (id: string) => {
    router.push(`/finance/periods/edit/${id}`)
  }

  // Confirm period deletion
  const handleDeleteConfirm = async () => {
    if (!periodToDelete) return
    
    try {
      const response = await fetch(`/api/finance/periods/${periodToDelete}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete period")
      }
      
      toast.success("Financial period deleted successfully")
      fetchPeriods()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to delete financial period")
      }
    } finally {
      setDeleteDialogOpen(false)
      setPeriodToDelete(null)
    }
  }
  
  // Open delete confirmation dialog
  const handleDeletePeriod = (id: string) => {
    setPeriodToDelete(id)
    setDeleteDialogOpen(true)
  }
  
  // Change period status
  const handleChangeStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/finance/periods/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to update period status to ${newStatus}`)
      }
      
      toast.success(`Period status updated to ${newStatus}`)
      fetchPeriods()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to update period status")
      }
    }
  }
  
  // Filter periods based on search query
  const filteredPeriods = periods.filter(period => {
    const searchLower = filters.searchQuery.toLowerCase()
    return (
      period.name.toLowerCase().includes(searchLower) ||
      period.type.toLowerCase().includes(searchLower) ||
      period.status.toLowerCase().includes(searchLower) ||
      period.year.toString().includes(searchLower)
    )
  })
  
  // Pagination logic
  const paginatedPeriods = filteredPeriods.slice(
    (pagination.currentPage - 1) * pagination.pageSize,
    pagination.currentPage * pagination.pageSize
  )
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>
      case "CLOSED":
        return <Badge className="bg-red-500 hover:bg-red-600">Closed</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>
    }
  }
  
  // Format date string
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "PPP")
  }
  
  // Render periods table
  const renderPeriodsTable = (statusFilter?: string) => {
    let displayPeriods = paginatedPeriods
    if (statusFilter) {
      displayPeriods = paginatedPeriods.filter(p => p.status === statusFilter)
    }
    
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )
    }
    
    if (displayPeriods.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-muted-foreground mb-4">No financial periods found</p>
          <Button variant="outline" onClick={handleCreatePeriod}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Period
          </Button>
        </div>
      )
    }
    
    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayPeriods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">{period.name}</TableCell>
                  <TableCell>{period.type}</TableCell>
                  <TableCell>{period.year}</TableCell>
                  <TableCell>{formatDate(period.startDate)}</TableCell>
                  <TableCell>{formatDate(period.endDate)}</TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditPeriod(period.id)}>
                          <Edit2Icon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {period.status !== "OPEN" && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(period.id, "OPEN")}>
                            <CheckCircleIcon className="mr-2 h-4 w-4 text-green-500" />
                            Open Period
                          </DropdownMenuItem>
                        )}
                        {period.status !== "CLOSED" && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(period.id, "CLOSED")}>
                            <XCircleIcon className="mr-2 h-4 w-4 text-red-500" />
                            Close Period
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeletePeriod(period.id)} className="text-red-600">
                          <Trash2Icon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex-1 text-sm text-muted-foreground">
            Showing {paginatedPeriods.length} of {filteredPeriods.length} periods
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pagination.pageSize.toString()} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </>
    )
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Financial Periods</CardTitle>
              <CardDescription>
                Manage financial periods for accounting and reporting
              </CardDescription>
            </div>
            <Button onClick={handleCreatePeriod}>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Period
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Periods</TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search periods..."
                    className="pl-8 w-[200px]"
                    value={filters.searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <Select value={filters.type} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="FISCAL">Fiscal</SelectItem>
                    <SelectItem value="CALENDAR">Calendar</SelectItem>
                    <SelectItem value="QUARTER">Quarter</SelectItem>
                    <SelectItem value="MONTH">Month</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.year} onValueChange={handleYearFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="all">
              {renderPeriodsTable()}
            </TabsContent>
            
            <TabsContent value="open">
              {renderPeriodsTable("OPEN")}
            </TabsContent>
            
            <TabsContent value="closed">
              {renderPeriodsTable("CLOSED")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Financial Period</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this financial period? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 