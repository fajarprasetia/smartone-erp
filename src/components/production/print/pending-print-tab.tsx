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
  Printer,
  Check,
  X
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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
  statusprod?: string | null
  keterangan?: string | null
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

// Print form schema
const printFormSchema = z.object({
  paperGsm: z.string().min(1, "Paper GSM is required"),
  paperWidth: z.string().min(1, "Paper width is required"),
  fileWidth: z.string().min(1, "File width is required"),
  ripBy: z.string().min(1, "RIP by is required"),
  dimensionFile: z.string().min(1, "RIP file dimension is required"),
  printMachine: z.string().min(1, "Printer is required"),
  printIcc: z.string().optional(),
  printTarget: z.string().min(1, "Target is required"),
  totalPrint: z.string().min(1, "Total print is required"),
  paperWaste: z.string().min(1, "Paper waste is required"),
});

type PrintFormValues = z.infer<typeof printFormSchema>;

// Paper stock interface for GSM and width dropdowns
interface PaperStockOption {
  id: string
  gsm: string
  width: string
  paperType?: string
  remaining_length?: string | number
}

export function PendingPrintTab() {
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
  
  // Print form state
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrderItem | null>(null)
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false)
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false)
  const [repeatOrderInfo, setRepeatOrderInfo] = useState<any>(null)
  const [paperStocks, setPaperStocks] = useState<PaperStockOption[]>([])
  const [availableGSMs, setAvailableGSMs] = useState<string[]>([])
  const [availableWidths, setAvailableWidths] = useState<string[]>([])
  const [isLoadingPaperOptions, setIsLoadingPaperOptions] = useState(false)

  // Initialize form
  const printForm = useForm<PrintFormValues>({
    resolver: zodResolver(printFormSchema),
    defaultValues: {
      paperGsm: "",
      paperWidth: "",
      fileWidth: "",
      ripBy: "",
      dimensionFile: "",
      printMachine: "",
      printIcc: "",
      printTarget: "",
      totalPrint: "",
      paperWaste: ""
    }
  })

  const fetchProductionOrders = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const apiUrl = `/api/production/orders?page=${page}&pageSize=${pageSize}&search=${search}&filter=PENDINGPRINT&status=PRINT READY&produk=PRINT`;
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

  // Fetch paper stock options for the GSM and width dropdowns
  const fetchPaperStockOptions = useCallback(async () => {
    setIsLoadingPaperOptions(true);
    try {
      // Create a specific endpoint for fetching paper GSM and width values for sublimation paper
      const response = await fetch('/api/inventory/paper-request/sublimation');
      
      if (!response.ok) {
        throw new Error("Failed to fetch sublimation paper options");
      }
      
      const data = await response.json();
      console.log("Sublimation paper data fetched:", data);
      
      if (data && data.gsms && data.gsms.length > 0) {
        // Set available GSMs from the API response
        console.log("Setting available GSMs:", data.gsms);
        setAvailableGSMs(data.gsms);
        
        // Store the width options by GSM for later use
        if (data.widthsByGsm) {
          console.log("Width options by GSM:", data.widthsByGsm);
          // Store paper stocks with their complete data
          setPaperStocks(data.stocks || []);
        }
      } else {
        console.log("No paper GSMs returned from API, using fallback values");
        setAvailableGSMs(["70", "80", "100", "120", "150"]);
      }
    } catch (error) {
      console.error("Error fetching paper stock options:", error);
      toast.error(`Failed to fetch paper options: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback to hardcoded values in case of error
      console.log("Error fetching paper stocks, using fallback values");
      setAvailableGSMs(["70", "80", "100", "120", "150"]);
    } finally {
      setIsLoadingPaperOptions(false);
    }
  }, []);

  // Fetch paper stocks on mount
  useEffect(() => {
    fetchPaperStockOptions();
  }, [fetchPaperStockOptions]);

  // Handle GSM change in print form
  const handleGSMChange = (gsm: string) => {
    // Set GSM value in form
    printForm.setValue("paperGsm", gsm);
    
    // Clear width field
    printForm.setValue("paperWidth", "");
    
    try {
      // Make a request to get widths for the selected GSM
      fetch(`/api/inventory/paper-request/sublimation/widths?gsm=${gsm}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch widths for GSM");
          }
          return response.json();
        })
        .then(data => {
          if (data && data.widths && data.widths.length > 0) {
            console.log(`Available widths for GSM ${gsm}:`, data.widths);
            setAvailableWidths(data.widths);
          } else {
            console.log(`No widths found for GSM ${gsm}, using fallback values`);
            setAvailableWidths(["100", "120", "150", "160", "180"]);
          }
        })
        .catch(error => {
          console.error(`Error fetching widths for GSM ${gsm}:`, error);
          setAvailableWidths(["100", "120", "150", "160", "180"]);
        });
    } catch (error) {
      console.error("Error in handleGSMChange:", error);
      setAvailableWidths(["100", "120", "150", "160", "180"]);
    }
  };

  // Handle width change in print form
  const handleWidthChange = (width: string) => {
    printForm.setValue("paperWidth", width);
  };

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
  
  // Get repeat order info if needed
  const fetchRepeatOrderInfo = async (spk: string) => {
    try {
      const response = await fetch(`/api/orders/spk?spk=${encodeURIComponent(spk)}`);
      if (!response.ok) throw new Error("Failed to fetch repeat order");
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching repeat order info:", error);
      return null;
    }
  }
  
  // Handle opening the print form dialog
  const handlePrintAction = async (order: ProductionOrderItem) => {
    setSelectedOrder(order);
    
    // Reset form with existing values if available
    printForm.reset({
      paperGsm: order.gramasi || "",
      paperWidth: order.lebar_kertas || "",
      fileWidth: order.lebar_file || "",
      ripBy: "",
      dimensionFile: "",
      printMachine: "",
      printIcc: "",
      printTarget: "",
      totalPrint: "",
      paperWaste: ""
    });
    
    // If an existing GSM is selected, update available widths accordingly
    if (order.gramasi) {
      const gsm = order.gramasi.toString();
      // Only set if the GSM is in the available options
      if (availableGSMs.includes(gsm)) {
        handleGSMChange(gsm);
      }
    }
    
    // Check if this is a repeat order and pre-fill RIP field
    if (order.statusprod === "REPEAT" && order.keterangan) {
      // Extract SPK number from keterangan if it contains it
      const spkMatch = order.keterangan.match(/SPK\s*[:|-]?\s*(\S+)/i);
      if (spkMatch && spkMatch[1]) {
        const repeatSpk = spkMatch[1];
        
        // Fetch the repeat order info
        const repeatOrder = await fetchRepeatOrderInfo(repeatSpk);
        if (repeatOrder && repeatOrder.rip) {
          printForm.setValue("ripBy", repeatOrder.rip);
          setRepeatOrderInfo(repeatOrder);
        }
      }
    }
    
    setIsPrintDialogOpen(true);
  }
  
  // Handle form submission
  const onPrintFormSubmit = async (values: PrintFormValues) => {
    if (!selectedOrder || !session?.user.id) {
      toast.error("Missing order or user information");
      return;
    }
    
    setIsSubmittingPrint(true);
    
    try {
      // Prepare the data for submission
      const printData = {
        // Print data
        gramasi: values.paperGsm,
        lebar_kertas: values.paperWidth,
        lebar_file: values.fileWidth,
        rip: values.ripBy,
        dimensi_file: values.dimensionFile,
        prints_mesin: values.printMachine,
        prints_icc: values.printIcc || "",
        prints_target: values.printTarget,
        prints_qty: values.totalPrint,
        prints_bagus: values.totalPrint, // Set good prints to total initially
        prints_waste: values.paperWaste,
        // Update status and set print operator
        print_id: session.user.id,
        status: "PRINT", // Set status to PRINT
        tgl_print: new Date().toISOString() // Set current date as print start date
      };
      
      console.log("Submitting print data:", printData);
      
      // Submit to API
      const response = await fetch(`/api/orders/${selectedOrder.id}/production/print`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update print data");
      }
      
      // Success
      toast.success("Order status updated to PRINT successfully");
      setIsPrintDialogOpen(false);
      
      // Refresh the order list after a short delay
      setTimeout(() => {
        fetchProductionOrders(pagination.currentPage, searchQuery);
      }, 500);
      
    } catch (error) {
      console.error("Error updating print data:", error);
      toast.error(`Failed to update print data: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmittingPrint(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Production List</CardTitle>
          <CardDescription>
            Orders ready for production with payment details
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
                      <div className="flex items-center sticky left-0 bg-muted/90 whitespace-nowrap">
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
                    <TableHead>Notes</TableHead>
                    <TableHead className="sticky right-0 bg-muted/90 whitespace-nowrap">Print</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell className="font-medium sticky left-0 bg-muted/90 whitespace-nowrap">
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
                        {order.catatan || "N/A"}
                      </TableCell>
                      <TableCell className="sticky right-0 bg-muted/90 whitespace-nowrap">
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handlePrintAction(order)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          PRINT
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
      
      {/* Print Order Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Print Order Form</DialogTitle>
            <DialogDescription>
              Fill in print information for order {selectedOrder?.spk}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {/* Customer Info Card - Uneditable */}
            <div className="mb-4">
              <h3 className="font-medium text-sm mb-2">Order Information</h3>
              <div className="bg-muted/40 p-3 rounded-md space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p>{formatDate(selectedOrder?.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SPK</Label>
                    <p>{selectedOrder?.spk || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <p>{selectedOrder?.customer?.nama || "N/A"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <p>{selectedOrder?.kategori || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <p>{selectedOrder?.prioritas === "YES" ? "High" : "Normal"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Due Date</Label>
                    <p>{formatDate(selectedOrder?.est_order)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Quantity</Label>
                    <p>{selectedOrder?.qty || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Print Form */}
            <Form {...printForm}>
              <form onSubmit={printForm.handleSubmit(onPrintFormSubmit)}>
                <h3 className="font-medium text-sm mb-2">Print Details</h3>
                
                <div className="space-y-3">
                  <FormField
                    control={printForm.control}
                    name="paperGsm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper GSM</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleGSMChange(value);
                          }}
                          disabled={isLoadingPaperOptions}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select GSM" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPaperOptions ? (
                              <SelectItem value="loading" disabled>
                                Loading...
                              </SelectItem>
                            ) : availableGSMs.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No GSM options available
                              </SelectItem>
                            ) : (
                              availableGSMs.map((gsm) => (
                                <SelectItem key={gsm} value={gsm}>
                                  {gsm}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="paperWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper Width</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleWidthChange(value);
                          }}
                          disabled={availableWidths.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select paper width" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableWidths.length === 0 ? (
                              <SelectItem value="none" disabled>
                                Select a GSM first
                              </SelectItem>
                            ) : (
                              availableWidths.map((width) => (
                                <SelectItem key={width} value={width}>
                                  {width}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="fileWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Width</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter file width" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="ripBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RIP by</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter RIP operator name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="dimensionFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RIP File Dimension</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter RIP file dimensions" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="printMachine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Printer</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter printer/machine name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="printIcc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ICC</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter ICC" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="printTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter target" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="totalPrint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Print (m)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" placeholder="Enter total print" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={printForm.control}
                    name="paperWaste"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper Waste (m)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="0" placeholder="Enter paper waste" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPrintDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmittingPrint}>
                    {isSubmittingPrint ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Start Print
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}