"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  RefreshCw, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  X,
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
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CaptureThumbnails } from "@/components/design/capture-thumbnails"
import { timeStamp } from "console"

interface ApprovalOrderItem  {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | null
  created_at?: Date | null
  prioritas?: string | null
  produk?: string | null
  nama_produk?: string | null
  asal_bahan?: string | null
  asal_bahan_id?: string | null
  nama_kain?: string | null
  customer_id?: number | null
  status?: string | null
  statusm?: string | null
  qty?: number | null
  nominal?: string | null
  sisa?: string | null
  tf_dp?: string | null
  tf_pelunasan?: string | null
  catatan?: string | null
  lebar_kain?: string | null
  lebar_kertas?: string | null
  lebar_file?: string | null
  gramasi?: string | null
  warna_acuan?: string | null
  approval?: string | null
  approval_mng?: string | null
  approval_opr?: string | null
  path?: string | null
  capture?: string | null
  capture_name?: string | null
  marketing?: {
    id: string
    name: string
  }
  targetSelesai?: Date | null
  est_order?: Date | null
  tipe_produk?: string | null
  kategori?: string | null
  dp?: string | null
  biaya_tambahan?: string | null
  designer_id?: {
    id: string
    name: string
  }
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
}

interface Pagination {
  totalCount: number
  totalPages: number
  currentPage: number
}

interface SortOption {
  field: string
  order: "asc" | "desc"
}

export function OrderTable() {
  // Renamed component to match import in ManagerPage
  const router = useRouter()
  
  const [orders, setOrders] = useState<ApprovalOrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1
  })
  const [pageSize, setPageSize] = useState(10)
  const [ordersSorting, setOrdersSorting] = useState<SortOption>({
    field: "created_at",
    order: "desc"
  })

  const fetchApprovalOrders = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const apiUrl = `/api/manager/approval?page=${page}&pageSize=${pageSize}&search=${search}&filter=READYFORPROD`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Failed to fetch Approval orders");
      }
      
      const data = await response.json();
      
      setOrders(data.orders || []);
      setPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      });
    } catch (error) {
      console.error("Error fetching Approval orders:", error);
      toast.error(`Failed to fetch Approval orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOrders([]);
      setPagination({
        totalCount: 0,
        totalPages: 1,
        currentPage: 1
      });
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, searchQuery]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchQuery])

  useEffect(() => {
    fetchApprovalOrders(pagination.currentPage, searchQuery)
  }, [pagination.currentPage, pageSize, searchQuery, fetchApprovalOrders])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    debounce(() => {
      fetchApprovalOrders(1, value)
    }, 500)()
  }

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "dd MMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date"
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchApprovalOrders(newPage, searchQuery)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchApprovalOrders(1, searchQuery);
  }

  const handleViewOrder = (order: ApprovalOrderItem) => {
    router.push(`/order/view/${order.id}`)
  }
const handleApproveOrder = async (order: ApprovalOrderItem) => {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      throw new Error('Failed to fetch user session');
    }

    const session = await response.json();
    const currentTime = new Date().toISOString();

    if (session.user?.role === "Manager") {
      const approvalResponse = await fetch(`/api/manager/approval/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approval_mng: "APPROVED",
          manager_id: session.user.id,
          tgl_app_manager: currentTime
        })
      });

      if (!approvalResponse.ok) {
        throw new Error('Failed to update manager approval');
      }
    } else if (session.user?.role === "Operation Manager") {
      const approvalResponse = await fetch(`/api/manager/approval/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approval_opr: "APPROVED",
          opr_id: session.user.id,
          tgl_app_prod: currentTime
        })
      });

      if (!approvalResponse.ok) {
        throw new Error('Failed to update operation manager approval');
      }
    } else {
      throw new Error('Unauthorized user role');
    }

    toast.success("Order approved successfully");
  } catch (error) {
    console.error("Error approving order:", error);
    toast.error(`Failed to approve order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const handleRejectOrder = async (order: ApprovalOrderItem) => {
  try {
    const response = await fetch('/api/auth/session');
    if (!response.ok) {
      throw new Error('Failed to fetch user session');
    }

    const session = await response.json();
    const currentTime = new Date().toISOString();

    if (session.user?.role === "Manager") {
      const rejectResponse = await fetch(`/api/manager/approval/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approval_mng: "REJECTED",
          manager_id: session.user.id,
          tgl_app_manager: currentTime
        })
      });

      if (!rejectResponse.ok) {
        throw new Error('Failed to update manager rejection');
      }
    } else if (session.user?.role === "Operation Manager") {
      const rejectResponse = await fetch(`/api/manager/approval/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          approval_opr: "REJECTED",
          opr_id: session.user.id,
          tgl_app_prod: currentTime
        })
      });

      if (!rejectResponse.ok) {
        throw new Error('Failed to update operation manager rejection');
      }
    } else {
      throw new Error('Unauthorized user role');
    }

    toast.success("Order rejected successfully");
  } catch (error) {
    console.error("Error rejecting order:", error);
    toast.error(`Failed to reject order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
  
           
  const getSortIcon = (field: string) => {
    if (ordersSorting.field !== field) return null
    return ordersSorting.order === "asc" ? 
      <ChevronUp className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1" />
  }

  const handleSort = (field: string) => {
    setOrdersSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
  }

  return (
    <div className="space-y-4">
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Approval List</CardTitle>
          <CardDescription>
            Orders ready for Approval with payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchApprovalOrders(pagination.currentPage, searchQuery)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("created_at")}
                    >
                      <div className="flex items-center">
                        Date
                        {getSortIcon("created_at")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("spk")}
                    >
                      <div className="flex items-center">
                        SPK
                        {getSortIcon("spk")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("kategori")}
                    >
                      <div className="flex items-center">
                        Category
                        {getSortIcon("kategori")}
                      </div>
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("est_order")}
                    >
                      <div className="flex items-center">
                        Due Date
                        {getSortIcon("est_order")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("prioritas")}
                    >
                      <div className="flex items-center">
                        Priority
                        {getSortIcon("prioritas")}
                      </div>
                    </TableHead>
                    <TableHead>Marketing</TableHead>   
                    <TableHead>Product Type</TableHead>                 
                    <TableHead>Product</TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("qty")}
                    >
                      <div className="flex items-center">
                        Qty
                        {getSortIcon("qty")}
                      </div>
                    </TableHead>
                    <TableHead>Designed By</TableHead>
                    <TableHead>Color Matching</TableHead>
                    <TableHead>Paper GSM</TableHead>
                    <TableHead>Paper Width</TableHead>
                    <TableHead>File Width</TableHead>
                    <TableHead>Fabric Width</TableHead>
                    <TableHead>Fabric Origins</TableHead>
                    <TableHead>Fabric Name</TableHead>                    
                    <TableHead>Status</TableHead>
                    <TableHead>Capture</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>DP</TableHead>
                    <TableHead>Balance</TableHead>                    
                    <TableHead>Total Price</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Payment Info</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.spk || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.kategori || "N/A"}
                      </TableCell>
                      
                      <TableCell>
                        {order.customer?.nama || "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.est_order) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.prioritas || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.marketing?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.tipe_produk || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.produk || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.qty || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.designer_id?.name || "N/A"} 
                      </TableCell>
                      <TableCell>
                        {order.warna_acuan || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.gramasi || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.lebar_kertas || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.lebar_file || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.lebar_kain || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.asal_bahan || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.nama_kain || "N/A"}
                      </TableCell>                      
                      <TableCell>
                        <Badge variant="outline">
                          {order.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                            <CaptureThumbnails
                              capture={order.capture}
                              captureName={order.capture_name}
                              altText={order.nama_produk || "Design"}
                            />
                          </TableCell>
                      <TableCell>
                        {order.catatan || "N/A"}
                      </TableCell>
                      <TableCell>
                        {(formatCurrency(order.dp)) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {(formatCurrency(order.sisa)) || "N/A"}
                      </TableCell>
                      <TableCell>
                        {(formatCurrency(order.nominal)) || "N/A"}
                      </TableCell>
                      <TableCell>
                            <CaptureThumbnails
                              tf_dp={order.tf_dp}
                              tf_pelunasan={order.tf_pelunasan}
                              altText={order.nama_produk || "Transfer"}
                            />
                          </TableCell>
                      <TableCell>
                        {order.biaya_tambahan || "N/A"}
                      </TableCell>
                          
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-32 h-8 bg-blue-500 text-white"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                          VIEW SPK
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-32 h-8 bg-green-500 text-white"
                          onClick={() => handleApproveOrder(order)}
                        >
                          <Check className="h-4 w-4" />
                          APPROVE
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-32 h-8 bg-red-500 text-white"
                          onClick={() => handleRejectOrder(order)}
                        >
                          <X className="h-4 w-4" />
                          REJECT
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isLoading && orders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {pagination.totalCount} total orders
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}