"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  PlusCircle, 
  RefreshCw, 
  Eye, 
  Pencil, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"
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
  CardFooter,
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

// Define the OrderItem interface based on requirements
interface OrderItem {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | null
  created_at?: Date | null
  produk?: string | null
  asal_bahan?: string | null
  customer_id?: number | null
  status?: string | null
  statusm?: string | null
  qty?: number | null
  catatan?: string | null
  marketing?: string | null // String field from database
  marketingInfo?: { // Added from API processing
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

// Page size options
const pageSizeOptions = [10, 20, 50, 100];

// Status badge configuration
const getStatusBadge = (status: string | null | undefined) => {
  if (!status) return <Badge variant="outline">Unknown</Badge>;
  
  const statusMap: Record<string, { label: string, className: string }> = {
    'PENDING': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' },
    'APPROVED': { label: 'Approved', className: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
    'REJECT': { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' },
    'PROSES': { label: 'In Process', className: 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' },
    'SELESAI': { label: 'Completed', className: 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100' },
    'DISERAHKAN': { label: 'Delivered', className: 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' },
  };
  
  const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100' };
  
  return <Badge className={config.className}>{config.label}</Badge>;
};

export default function OrderPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<OrderItem[]>([])
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  })
  const [pageSize, setPageSize] = useState(10)
  
  // Fetch orders
  const fetchOrders = async (page = 1, pageSize = 10, searchTerm = "") => {
    try {
      setIsLoading(true)
      let url = `/api/orders?page=${page}&pageSize=${pageSize}`
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }
      
      const data = await response.json()
      
      setOrders(data.orders || [])
      setFilteredOrders(data.orders || [])
      
      // Update pagination with the new structure
      setPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      })
      
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders(pagination.currentPage, pageSize, searchQuery)
  }, [pagination.currentPage, pageSize])
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase()
      const filtered = orders.filter(order => 
        (order.spk && order.spk.toLowerCase().includes(lowercaseQuery)) ||
        (order.no_project && order.no_project.toLowerCase().includes(lowercaseQuery)) ||
        (order.produk && order.produk.toLowerCase().includes(lowercaseQuery)) ||
        (order.customer?.nama && order.customer.nama.toLowerCase().includes(lowercaseQuery)) ||
        (order.customer?.telp && order.customer.telp.includes(searchQuery)) ||
        (order.status && order.status.toLowerCase().includes(lowercaseQuery)) ||
        (order.marketing && order.marketing.toLowerCase().includes(lowercaseQuery)) ||
        (order.marketingInfo?.name && order.marketingInfo.name.toLowerCase().includes(lowercaseQuery))
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchQuery, orders])
  
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
    
    fetchOrders(newPage, pageSize, searchQuery);
  }
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchOrders(1, newSize, searchQuery);
  }
  
  // Handle view order
  const handleViewOrder = (order: OrderItem) => {
    router.push(`/order/view/${order.id}`)
  }
  
  // Handle edit order
  const handleEditOrder = (orderId: string) => {
    router.push(`/order/edit/${orderId}`)
  }
  
  // Handle delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        })
        
        if (!response.ok) {
          throw new Error("Failed to delete order")
        }
        
        toast.success("Order deleted successfully")
        fetchOrders(pagination.currentPage, pageSize, searchQuery)
      } catch (error) {
        console.error("Error deleting order:", error)
        toast.error("Failed to delete order")
      }
    }
  }

  return (
    <div className="container mx-auto space-y-4 h-full flex flex-col overflow-visible">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchOrders(1, pageSize)}
            className="bg-background/50 border-border/50 hover:bg-background/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            className="bg-primary/90 hover:bg-primary text-primary-foreground"
            onClick={() => router.push("/order/add")}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Order
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
                placeholder="Search orders by SPK, project, customer, product..."
                className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
              onClick={() => setSearchQuery("")}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage your customer orders and track their status.
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
                      <TableHead>Date</TableHead>
                      <TableHead>No Project</TableHead>
                      <TableHead>SPK</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Fabric Origins</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Marketing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                          {searchQuery 
                            ? "No orders match your search criteria" 
                            : "No orders found. Add an order to get started!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                          <TableCell>{order.no_project || "N/A"}</TableCell>
                          <TableCell>{order.spk || "N/A"}</TableCell>
                          <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                          <TableCell>
                            {order.customer?.telp 
                              ? `62${order.customer.telp.startsWith('8') ? order.customer.telp : order.customer.telp.replace(/^0+/, '')}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{order.produk || "N/A"}</TableCell>
                          <TableCell>{order.asal_bahan || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(order.status || order.statusm)}</TableCell>
                          <TableCell>{order.qty || "N/A"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{order.catatan || "N/A"}</TableCell>
                          <TableCell>{order.marketingInfo?.name || order.marketing || "N/A"}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                  <Eye className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditOrder(order.id)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDeleteOrder(order.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                    Showing <span className="font-medium">{filteredOrders.length}</span> of{" "}
                    <span className="font-medium">{pagination.totalCount}</span> orders
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