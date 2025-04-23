"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Search, 
  RefreshCw, 
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { debounce } from "lodash"
import Image from "next/image"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

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
  CardFooter,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProductionOrderItem {
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
  catatan?: string | null
  lebar_kain?: string | null
  lebar_kertas?: string | null
  lebar_file?: string | null
  gramasi?: string | null
  warna_acuan?: string | null
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
  print_id?: {
    id: string
    name: string
  }
  prints_mesin?: string | null
  prints_icc?: string | null
  prints_target?: string | null
  prints_qty?: string | null
  tgl_print?: Date | null
  print_done?: Date | null
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

// Schema validation for print done form
const printDoneFormSchema = z.object({
  prints_bagus: z.string().min(1, "Total good prints is required"),
  prints_reject: z.string().min(1, "Rejected prints is required"),
  prints_waste: z.string().default("0"),
  catatan_print: z.string().default(""),
});

type PrintDoneFormValues = z.infer<typeof printDoneFormSchema>;

export function PrintListTab() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const [orders, setOrders] = useState<ProductionOrderItem[]>([])
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
  
  // Print done form state
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderItem | null>(null)
  const [isPrintDonePopoverOpen, setIsPrintDonePopoverOpen] = useState(false)
  const [isSubmittingPrintDone, setIsSubmittingPrintDone] = useState(false)

  // Initialize form with explicit type
  const printDoneForm = useForm<PrintDoneFormValues>({
    resolver: zodResolver(printDoneFormSchema) as any,
    defaultValues: {
      prints_bagus: "",
      prints_reject: "",
      prints_waste: "0",
      catatan_print: ""
    }
  })

  const fetchProductionOrders = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const apiUrl = `/api/production/orders?page=${page}&pageSize=${pageSize}&search=${search}&filter=PRINTING&status=PRINT`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error("Failed to fetch production orders");
      }
      
      const data = await response.json();
      
      // Filter out "PRESS ONLY" and "CUTTING ONLY" orders
      const filteredOrders = (data.orders || []).filter((order: ProductionOrderItem) => {
        const produk = (order.produk || "").toUpperCase();
        return produk !== "PRESS ONLY" && produk !== "CUTTING ONLY";
      });
      
      setOrders(filteredOrders);
      setPagination({
        totalCount: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / pageSize) || 1,
        currentPage: data.currentPage || 1
      });
    } catch (error) {
      console.error("Error fetching production orders:", error);
      toast.error(`Failed to fetch production orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    fetchProductionOrders(pagination.currentPage, searchQuery)
  }, [pagination.currentPage, pageSize, searchQuery, fetchProductionOrders])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    debounce(() => {
      fetchProductionOrders(1, value)
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
    fetchProductionOrders(newPage, searchQuery)
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchProductionOrders(1, searchQuery);
  }

  const handleViewOrder = (order: ProductionOrderItem) => {
    router.push(`/order/view/${order.id}`)
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

  // Handle opening the print done form popover
  const handlePrintDoneAction = (order: ProductionOrderItem) => {
    setSelectedOrder(order);
    
    // Reset form
    printDoneForm.reset({
      prints_bagus: order.prints_qty || "",
      prints_reject: "0",
      prints_waste: "0",
      catatan_print: ""
    });
    
    setIsPrintDonePopoverOpen(true);
  }
  
  // Handle form submission
  const onPrintDoneFormSubmit = async (values: PrintDoneFormValues) => {
    if (!selectedOrder || !session?.user.id) {
      toast.error("Missing order or user information");
      return;
    }
    
    setIsSubmittingPrintDone(true);
    
    try {
      // Check if this is a PRINT ONLY order
      const isPrintOnly = selectedOrder.produk === "PRINT ONLY";
      
      // Prepare the data for submission
      const printDoneData = {
        // Print data
        prints_bagus: values.prints_bagus,
        prints_reject: values.prints_reject,
        prints_waste: values.prints_waste,
        catatan_print: values.catatan_print,
        // Update status is handled on the server side
        print_done: new Date().toISOString(), // Set current date as print completion date
        // For PRINT ONLY orders, also set the statusm to JOB DONE
        statusm: isPrintOnly ? "JOB DONE" : undefined
      };
      
      console.log("Submitting print done data:", printDoneData);
      console.log("Is PRINT ONLY order:", isPrintOnly);
      
      // Submit to API
      const response = await fetch(`/api/orders/${selectedOrder.id}/production/print-done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printDoneData),
      });
      
      if (!response.ok) {
        // Try to get detailed error from response
        try {
          const errorData = await response.json();
          console.error("Server error details:", errorData);
          throw new Error(errorData.error || errorData.details || "Failed to mark print as done");
        } catch (parseError) {
          // If we can't parse the error JSON, use the status text
          throw new Error(`Failed to mark print as done: ${response.status} ${response.statusText}`);
        }
      }
      
      // Success
      toast.success(isPrintOnly 
        ? "Print job completed and marked as JOB DONE" 
        : "Print job marked as completed successfully");
      setIsPrintDonePopoverOpen(false);
      
      // Refresh the order list after a short delay
      setTimeout(() => {
        fetchProductionOrders(pagination.currentPage, searchQuery);
      }, 500);
      
    } catch (error) {
      console.error("Error marking print as done:", error);
      toast.error(`Failed to mark print as done: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmittingPrintDone(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Print Jobs</CardTitle>
          <CardDescription>
            Orders currently in the printing process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search print jobs..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchProductionOrders(pagination.currentPage, searchQuery)}>
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
              <p className="text-muted-foreground">No active print jobs found</p>
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
                      onClick={() => handleSort("prioritas")}
                    >
                      <div className="flex items-center">
                        Priority
                        {getSortIcon("prioritas")}
                      </div>
                    </TableHead>
                    <TableHead>Print Operator</TableHead>
                    <TableHead>Print Machine</TableHead>                 
                    <TableHead>Print ICC</TableHead>
                    <TableHead>Print Target</TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("tgl_print")}
                    >
                      <div className="flex items-center">
                        Start Date
                        {getSortIcon("tgl_print")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer" 
                      onClick={() => handleSort("est_order")}
                    >
                      <div className="flex items-center">
                        Due Date
                        {getSortIcon("est_order")}
                      </div>
                    </TableHead>
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
                    <TableHead>Paper GSM</TableHead>
                    <TableHead>Paper Width</TableHead>
                    <TableHead>File Width</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
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
                        {order.prioritas === "YES" ? (
                          <Badge variant="destructive">High</Badge>
                        ) : "Normal"}
                      </TableCell>
                      <TableCell>
                        {order.print_id?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.prints_mesin || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.prints_icc || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.prints_target || "N/A"}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.tgl_print)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.est_order)}
                      </TableCell>
                      <TableCell>
                        {order.produk === "PRINT ONLY" ? (
                          <span className="font-semibold text-blue-600">PRINT ONLY</span>
                        ) : (
                          order.produk || "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {order.qty || "N/A"}
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
                        <Badge variant="outline">
                          {order.status || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.catatan || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Popover open={isPrintDonePopoverOpen && selectedOrder?.id === order.id} onOpenChange={(open) => !open && setIsPrintDonePopoverOpen(false)}>
                          <PopoverTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handlePrintDoneAction(order)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              PRINT DONE
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="end">
                            <Card className="border-0 shadow-none">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Complete Print Job</CardTitle>
                                <CardDescription>
                                  Mark print job as completed for order {order.spk}
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <ScrollArea className="h-[400px] pr-4">
                                  {/* Order Info Card - Uneditable */}
                                  <div className="mb-4">
                                    <h3 className="font-medium text-sm mb-2">Order Information</h3>
                                    <div className="bg-muted/40 p-3 rounded-md space-y-2 text-sm">
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs text-muted-foreground">SPK</Label>
                                          <p>{selectedOrder?.spk || "N/A"}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Customer</Label>
                                          <p>{selectedOrder?.customer?.nama || "N/A"}</p>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Print Started</Label>
                                          <p>{formatDate(selectedOrder?.tgl_print)}</p>
                                        </div>
                                        <div>
                                          <Label className="text-xs text-muted-foreground">Print Operator</Label>
                                          <p>{selectedOrder?.print_id?.name || "N/A"}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <Label className="text-xs text-muted-foreground">Print Target</Label>
                                        <p>{selectedOrder?.prints_target || "N/A"}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Print Done Form */}
                                  <Form {...printDoneForm}>
                                    <form onSubmit={printDoneForm.handleSubmit(onPrintDoneFormSubmit as any)}>
                                      <h3 className="font-medium text-sm mb-2">Print Results</h3>
                                      
                                      <div className="space-y-3">
                                        <FormField
                                          control={printDoneForm.control as any}
                                          name="prints_bagus"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Total Good Prints (m)</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Enter total good prints" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={printDoneForm.control as any}
                                          name="prints_reject"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Rejected Prints (m)</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Enter rejected prints" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={printDoneForm.control as any}
                                          name="prints_waste"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Waste (m)</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Enter waste prints" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                        
                                        <FormField
                                          control={printDoneForm.control as any}
                                          name="catatan_print"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel>Notes</FormLabel>
                                              <FormControl>
                                                <Input {...field} placeholder="Add any additional notes (optional)" />
                                              </FormControl>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      </div>
                                      
                                      <div className="mt-4 flex justify-end">
                                        <Button type="submit" disabled={isSubmittingPrintDone}>
                                          {isSubmittingPrintDone ? (
                                            <>Processing...</>
                                          ) : (
                                            <>
                                              <Check className="h-4 w-4 mr-1" />
                                              Complete Print Job
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </form>
                                  </Form>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          </PopoverContent>
                        </Popover>
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
                  {pagination.totalCount} total print jobs
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 