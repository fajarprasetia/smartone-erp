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
  spk?: string | null
  tanggal?: string | null
  produk?: string | null
  customer_id?: number | null
  customer?: {
    id: string | number
    name: string
  } | null
  statusm?: string | null
  status?: string | null
  approval_barang?: string | null
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
  
  // Fetch outbound orders
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/inventory/outbound")
      
      if (!response.ok) {
        throw new Error("Failed to fetch outbound orders")
      }
      
      const data = await response.json()
      setOrders(data)
      setFilteredOrders(data)
    } catch (error) {
      console.error("Error fetching outbound orders:", error)
      toast.error("Failed to load outbound orders")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchOrders()
  }, [])
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase()
      const filtered = orders.filter(order => 
        (order.spk && order.spk.toLowerCase().includes(lowercaseQuery)) ||
        (order.produk && order.produk.toLowerCase().includes(lowercaseQuery)) ||
        (order.customer && order.customer.name && 
          order.customer.name.toLowerCase().includes(lowercaseQuery))
      )
      setFilteredOrders(filtered)
    } else {
      setFilteredOrders(orders)
    }
  }, [searchQuery, orders])
  
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
  const formatDate = (dateString: string | null | undefined) => {
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
            placeholder="Search by SPK, product, or customer..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchOrders} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Ready for Handover</CardTitle>
          <CardDescription>
            Manage outbound orders that are approved and ready for handover.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex space-x-4 items-center">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SPK</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QC Approval</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        {searchQuery 
                          ? "No orders match your search criteria" 
                          : "No outbound orders found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                      >
                        <TableCell className="font-medium">{order.spk || "N/A"}</TableCell>
                        <TableCell>{formatDate(order.tanggal)}</TableCell>
                        <TableCell>{order.produk || "N/A"}</TableCell>
                        <TableCell>
                          {order.customer?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.statusm === "DISERAHKAN"
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
                            }
                          >
                            {order.statusm || order.status || "Processing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              order.approval_barang === "APPROVED"
                                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                                : order.approval_barang === "REJECTED" 
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100"
                            }
                          >
                            {order.approval_barang || "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-900 dark:bg-green-800/30 dark:text-green-500 dark:hover:bg-green-800/40"
                            onClick={() => confirmAction(order.id, "handover")}
                            disabled={isLoading || processingOrder === order.id}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Hand Over
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900 dark:bg-red-800/30 dark:text-red-500 dark:hover:bg-red-800/40"
                            onClick={() => confirmAction(order.id, "reject_qc")}
                            disabled={isLoading || processingOrder === order.id}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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