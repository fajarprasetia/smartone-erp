"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckCircle, XCircle, RefreshCw, X } from "lucide-react"
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
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// Define the order interface based on schema
interface Order {
  id: string
  spk: string
  tanggal: string | Date
  status: string
  statusm?: string
  produk?: string
  nama_produk?: string
  kategori?: string
  customer: {
    id: string
    nama: string
  }
  approval_barang?: string
  jumlah: string
  jumlah_kain: string
  qty: string
  harga_satuan: string
  nominal: string
  created_at: string | Date
  updated_at: string | Date
  dtf_done: string | Date | null
  catatan_print?: string
  catatan_cutting?: string
  catatan_dtf?: string
  catatan_press?: string
  reject?: string | null
  panjang_kain?: string
  panjang_order?: string
  sisa_kain?: string
  userId?: string
  produkId?: string
  customerId: string
}

// ConfirmActionDialog component
function ConfirmActionDialog({
  open,
  onOpenChange,
  actionType,
  onConfirm,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionType: "handover" | "reject_qc" | null
  onConfirm: () => void
  isLoading: boolean
}) {
  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  if (!open || !actionType) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-md mx-4 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40">
          <div>
            <h2 className="text-lg font-semibold">
              {actionType === "handover" ? "Confirm Hand Over" : "Confirm Rejection"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {actionType === "handover"
                ? "Are you sure you want to mark this order as handed over?"
                : "Are you sure you want to reject this order?"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <p className="text-muted-foreground mb-6">
            {actionType === "handover"
              ? "This action will mark the order as handed over to the customer. This action cannot be undone."
              : "This will mark the QC as rejected. Are you sure you want to proceed?"}
          </p>

          <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end gap-2")}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-border/40 bg-background/50"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={onConfirm}
              disabled={isLoading}
              className={actionType === "handover" 
                ? "bg-green-600/90 hover:bg-green-700 text-white backdrop-blur-sm" 
                : "bg-red-600/90 hover:bg-red-700 text-white backdrop-blur-sm"}
            >
              {isLoading 
                ? "Processing..." 
                : actionType === "handover" 
                  ? "Confirm Hand Over" 
                  : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InventoryOutboundPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [processingOrder, setProcessingOrder] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"handover" | "reject_qc" | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3
  
  // Fetch outbound orders
  const fetchOrders = async () => {
    // Don't retry too many times automatically
    if (retryCount >= MAX_RETRIES) {
      setFetchError("Maximum retry attempts reached. Please try again manually.")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setFetchError(null)

      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const response = await fetch("/api/inventory/outbound", {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch outbound orders: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setOrders(data)
      setFilteredOrders(data)
      // Reset retry count on success
      setRetryCount(0)
    } catch (error) {
      console.error("Error fetching outbound orders:", error)
      setFetchError(error instanceof Error ? error.message : String(error))
      
      // Only increment retry count for network errors, not for user-aborted requests
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setRetryCount(prev => prev + 1)
      }
      
      toast.error("Failed to load outbound orders")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
  }, [])
  
  // Manual retry function
  const handleRetry = () => {
    setRetryCount(0)
    fetchOrders()
  }
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = orders.filter(order => 
        (order.spk && order.spk.toLowerCase().includes(lowercaseQuery)) ||
        (order.produk && order.produk.toLowerCase().includes(lowercaseQuery)) ||
        (order.nama_produk && order.nama_produk.toLowerCase().includes(lowercaseQuery)) || 
        (order.customer?.nama && order.customer.nama.toLowerCase().includes(lowercaseQuery)) ||
        (order.kategori && order.kategori.toLowerCase().includes(lowercaseQuery)) ||
        (order.status && order.status.toLowerCase().includes(lowercaseQuery)) ||
        (order.statusm && order.statusm.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);
  
  // Handle order action (handover or reject)
  const handleOrderAction = async () => {
    if (!processingOrder || !actionType) return
    
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/inventory/outbound", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: processingOrder,
          action: actionType,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${actionType === "handover" ? "hand over" : "reject"} order`)
      }
      
      toast.success(
        actionType === "handover" 
          ? "Order marked as handed over successfully" 
          : "Order rejected successfully"
      )
      
      // Refresh the orders list
      fetchOrders()
    } catch (error) {
      console.error(`Error ${actionType === "handover" ? "handing over" : "rejecting"} order:`, error)
      toast.error(`Failed to ${actionType === "handover" ? "hand over" : "reject"} order`)
    } finally {
      setIsLoading(false)
      setProcessingOrder(null)
      setActionType(null)
      setIsDialogOpen(false)
    }
  }
  
  // Format date
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Open confirmation dialog
  const confirmAction = (orderId: string, action: "handover" | "reject_qc") => {
    setProcessingOrder(orderId)
    setActionType(action)
    setIsDialogOpen(true)
  }

  // Helper function to get product name, handling different field names
  const getProductName = (order: Order): string => {
    return order.nama_produk || order.produk || 'N/A';
  };

  // Helper function to get customer name
  const getCustomerName = (order: Order): string => {
    if (order.customer?.nama) {
      return order.customer.nama;
    }
    return 'N/A';
  };

  // Helper function to get status badge details
  const getStatusBadge = (order: Order) => {
    // Display status from status field or statusm field
    const status = order.statusm || order.status || "DELIVERY";
    
    // Determine badge style based on status
    let badgeClass = "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100";
    
    if (status === "DISERAHKAN" || status === "DELIVERY") {
      badgeClass = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    } else if (status === "REJECTED" || status === "CANCELLED") {
      badgeClass = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    }
    
    return { status, badgeClass };
  };
  
  // Helper function to get QC approval badge details
  const getApprovalBadge = (order: Order) => {
    const approval = order.approval_barang || "APPROVED";
    
    let badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100";
    
    if (approval === "APPROVED") {
      badgeClass = "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100";
    } else if (approval === "REJECTED") {
      badgeClass = "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100";
    }
    
    return { approval, badgeClass };
  };
  
  // Helper function to get DTF status
  const getDtfStatus = (order: Order) => {
    if (order.dtf_done) {
      return { status: "Completed", badgeClass: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100" };
    }
    return { status: "Pending", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100" };
  };

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Outbound</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by SPK, product, customer, status..."
            className="pl-8 bg-transparent border-border/50 focus-visible:ring-primary/70"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRetry} title="Refresh" className="bg-transparent border-border/50 hover:bg-background/10">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      {fetchError && (
        <Card className="bg-red-50/20 border-red-300/50 backdrop-blur-md backdrop-saturate-150">
          <CardHeader className="pb-2 bg-transparent">
            <CardTitle className="flex items-center text-red-600">
              <XCircle className="mr-2 h-5 w-5" /> Error Loading Data
            </CardTitle>
            <CardDescription className="text-red-500">
              {fetchError}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 bg-transparent flex justify-end">
            <Button 
              onClick={handleRetry} 
              variant="outline" 
              className="bg-white/50 border-red-200 text-red-600 hover:bg-red-50"
              disabled={isLoading}
            >
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Card className="bg-transparent border-border/30 backdrop-blur-md backdrop-saturate-150">
        <CardHeader className="pb-2 bg-transparent">
          <CardTitle>Completed Orders</CardTitle>
          <CardDescription>
            Manage completed orders are ready for handover.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex space-x-4 items-center">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-border/30">
              <Table>
                <TableHeader className="sticky top-0 bg-transparent z-10">
                  <TableRow>
                    <TableHead>SPK</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QC Approval</TableHead>
                    <TableHead>DTF Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground bg-transparent">
                        {searchQuery 
                          ? "No orders match your search criteria" 
                          : fetchError 
                            ? "Failed to load orders. Please try again." 
                            : "No outbound orders found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusBadge = getStatusBadge(order);
                      const approvalBadge = getApprovalBadge(order);
                      const dtfBadge = getDtfStatus(order);
                      
                      return (
                        <TableRow 
                          key={order.id}
                          className="bg-transparent hover:bg-background/10"
                        >
                          <TableCell className="font-medium bg-transparent">{order.spk || "N/A"}</TableCell>
                          <TableCell className="bg-transparent">{formatDate(order.tanggal)}</TableCell>
                          <TableCell className="bg-transparent">{getProductName(order)}</TableCell>
                          <TableCell className="bg-transparent">
                            {getCustomerName(order)}
                          </TableCell>
                          <TableCell className="bg-transparent">
                            <Badge className={statusBadge.badgeClass}>
                              {statusBadge.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="bg-transparent">
                            <Badge className={approvalBadge.badgeClass}>
                              {approvalBadge.approval}
                            </Badge>
                          </TableCell>
                          <TableCell className="bg-transparent">
                            <Badge className={dtfBadge.badgeClass}>
                              {dtfBadge.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right space-x-2 bg-transparent">
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-100/80 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-800/30 dark:text-green-500 dark:hover:bg-green-800/40"
                              onClick={() => confirmAction(order.id, "handover")}
                              disabled={isLoading || processingOrder === order.id}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Hand Over
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-red-100/80 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-800/30 dark:text-red-500 dark:hover:bg-red-800/40"
                              onClick={() => confirmAction(order.id, "reject_qc")}
                              disabled={isLoading || processingOrder === order.id}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <ConfirmActionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        actionType={actionType}
        onConfirm={handleOrderAction}
        isLoading={isLoading}
      />
    </div>
  )
}