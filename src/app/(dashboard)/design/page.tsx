"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Pencil, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Webhook,
  Settings,
  Image as ImageIcon
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { debounce } from "lodash"
import Image from "next/image"

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define the DesignOrderItem interface
interface DesignOrderItem {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | null
  created_at?: Date | null
  produk?: string | null
  nama_produk?: string | null
  asal_bahan?: string | null
  asal_bahan_id?: string | null
  customer_id?: number | null
  status?: string | null
  statusm?: string | null
  qty?: number | null
  catatan?: string | null
  lebar_kain?: string | null
  lebar_kertas?: string | null
  warna_acuan?: string | null
  path?: string | null
  capture?: string | null
  capture_name?: string | null
  marketing?: string | null
  designer_id?: {
    id: string
    name: string
  } | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
}

// Pagination interface
interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
}

// Define a type for sorting options
interface SortOption {
  field: string
  order: "asc" | "desc"
}

export default function DesignPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<DesignOrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null)
  
  // Sorting state
  const [ordersSorting, setOrdersSorting] = useState<SortOption>({ field: "created_at", order: "desc" })
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  })
  const [pageSize, setPageSize] = useState(10)
  
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session.user) {
            setCurrentUser({
              id: session.user.id,
              name: session.user.name
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch design orders
  const fetchDesignOrders = async (page = 1, pageSize = 10, searchTerm = "", sorting: SortOption = ordersSorting) => {
    try {
      setIsLoading(true)
      
      // We specifically want orders with statusm = "DESIGN"
      let url = `/api/orders?page=${page}&pageSize=${pageSize}&statusm=DESIGN&sortField=${sorting.field}&sortOrder=${sorting.order}`
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch design orders")
      }
      
      const data = await response.json()
      
      setOrders(data.orders || [])
      
      // Update pagination with the server-provided counts
      setPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      })
      
    } catch (error) {
      console.error("Error fetching design orders:", error)
      toast.error("Failed to load design orders")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, [searchQuery])
  
  // Fetch orders when pagination, pageSize, searchQuery, or sorting changes
  useEffect(() => {
    fetchDesignOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting)
  }, [pagination.currentPage, pageSize, searchQuery, ordersSorting])

  // Initial fetch on component mount
  useEffect(() => {
    fetchDesignOrders(1, pageSize)
  }, [])
  
  // Handle sorting changes for orders
  const handleOrdersSort = (field: string) => {
    setOrdersSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
  }
  
  // Get sort icon for column headers
  const getSortIcon = (field: string, sorting: SortOption) => {
    if (sorting.field !== field) return null
    
    return sorting.order === "asc" ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />
  }
  
  // SortableTableHead component
  const SortableTableHead = ({ 
    children, 
    field, 
    sorting, 
    onSort 
  }: { 
    children: React.ReactNode, 
    field: string, 
    sorting: SortOption, 
    onSort: (field: string) => void 
  }) => (
    <TableHead 
      onClick={() => onSort(field)}
      className="cursor-pointer hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field, sorting)}
      </div>
    </TableHead>
  )
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Debounce the actual search
    debounce(() => {
      fetchDesignOrders(1, pageSize, value, ordersSorting)
    }, 500)()
  }
  
  // Format date
  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      return format(new Date(dateValue), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    fetchDesignOrders(newPage, pageSize, searchQuery, ordersSorting);
  }

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchDesignOrders(1, newSize, searchQuery, ordersSorting);
  }
  
  // Handle view order
  const handleViewOrder = (order: DesignOrderItem) => {
    router.push(`/order/view/${order.id}`)
  }
  
  // Handle process order (assign to self)
  const handleProcessOrder = async (orderId: string) => {
    if (!currentUser) {
      toast.error("You must be logged in to process orders")
      return
    }
    
    try {
      const response = await fetch(`/api/design/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          designerId: currentUser.id
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to process design order")
      }
      
      toast.success("Order assigned to you for processing")
      fetchDesignOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting)
    } catch (error) {
      console.error("Error processing order:", error)
      toast.error("Failed to process order")
    }
  }
  
  // Handle edit design
  const handleEditDesign = async (orderId: string) => {
    // Will be implemented later - for now just navigate to a placeholder
    router.push(`/design/edit/${orderId}`)
  }
  
  // Handle produce (mark as ready for production)
  const handleProduce = async (orderId: string) => {
    // Will be implemented later - for now just show a message
    toast.info("This feature will be implemented later")
  }

  return (
    <div className="container mx-auto space-y-4 h-full flex flex-col overflow-visible">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Design Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchDesignOrders(1, pageSize)}
            className="bg-background/50 border-border/50 hover:bg-background/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="py-4 bg-background/80 backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search design orders by SPK, customer, product..."
                className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
              onClick={() => {
                setSearchQuery("");
                fetchDesignOrders(1, pageSize);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Design Orders</CardTitle>
          <CardDescription>
            Manage design tasks and track their progress.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-visible">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex space-x-4 items-center">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border flex-1 flex flex-col">
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <SortableTableHead field="created_at" sorting={ordersSorting} onSort={handleOrdersSort}>Date</SortableTableHead>
                      <SortableTableHead field="spk" sorting={ordersSorting} onSort={handleOrdersSort}>SPK</SortableTableHead>
                      <TableHead>Customer</TableHead>
                      <SortableTableHead field="produk" sorting={ordersSorting} onSort={handleOrdersSort}>Product</SortableTableHead>
                      <TableHead>Product Name</TableHead>
                      <SortableTableHead field="qty" sorting={ordersSorting} onSort={handleOrdersSort}>Length</SortableTableHead>
                      <TableHead>Fabric Width</TableHead>
                      <TableHead>Paper Width</TableHead>
                      <TableHead>Color Matching</TableHead>
                      <TableHead>PATH</TableHead>
                      <TableHead>Designer</TableHead>
                      <TableHead>Capture</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                          {searchQuery 
                            ? "No design orders match your search criteria" 
                            : "No design orders found. Add a design order to get started!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                          <TableCell>
                            <span 
                              className="text-primary hover:text-primary/80 cursor-pointer hover:underline"
                              onClick={() => handleViewOrder(order)}
                            >
                              {order.spk || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                          <TableCell>{order.produk || "N/A"}</TableCell>
                          <TableCell>{order.nama_produk || "N/A"}</TableCell>
                          <TableCell>{order.qty || "N/A"}</TableCell>
                          <TableCell>{order.lebar_kain || "N/A"}</TableCell>
                          <TableCell>{order.lebar_kertas || "N/A"}</TableCell>
                          <TableCell>{order.warna_acuan || "N/A"}</TableCell>
                          <TableCell className="max-w-[100px] truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">{order.path || "N/A"}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[300px] break-all">{order.path || "No path specified"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{order.designer_id?.name || "Unassigned"}</TableCell>
                          <TableCell>
                            {order.capture ? (
                              <div className="relative h-8 w-8 cursor-pointer">
                                <Image
                                  src={`/uploads/${order.capture}`}
                                  alt="Design preview"
                                  width={32}
                                  height={32}
                                  className="object-contain rounded-sm"
                                />
                              </div>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">{order.catatan || "N/A"}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-[300px]">{order.catatan || "No notes"}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              {/* Process button - only shown if no designer_id */}
                              {!order.designer_id && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleProcessOrder(order.id)}
                                  className="h-8 px-2 text-xs"
                                >
                                  <Webhook className="h-3.5 w-3.5 mr-1" />
                                  Process
                                </Button>
                              )}
                              
                              {/* Edit and Produce buttons - only shown if assigned to current user */}
                              {order.designer_id?.id === currentUser?.id && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditDesign(order.id)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleProduce(order.id)}
                                    className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                  >
                                    <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                    Produce
                                  </Button>
                                </>
                              )}
                              
                              {/* View button - always visible */}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleViewOrder(order)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{orders.length}</span> of{" "}
                    <span className="font-medium">{pagination.totalCount}</span> design orders
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1 || isLoading}
                  >
                    <span className="sr-only">First page</span>
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || isLoading}
                  >
                    <span className="sr-only">Previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm font-medium">
                    Page {pagination.currentPage} of {pagination.totalPages || 1}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                  >
                    <span className="sr-only">Next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                  >
                    <span className="sr-only">Last page</span>
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 