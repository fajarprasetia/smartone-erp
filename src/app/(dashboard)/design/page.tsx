"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Pencil, 
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Webhook,
  XCircle,
  AlertCircle,
  X
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { debounce } from "lodash"
import Image from "next/image"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CaptureThumbnails } from "@/components/design/capture-thumbnails"

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
  targetSelesai?: Date | null
  tipe_produk?: string | null
  kategori?: string | null
  jenisProduk?: {
    PRINT: boolean
    PRESS: boolean
    CUTTING: boolean
    DTF: boolean
    SEWING: boolean
  } | null
  designer_id?: {
    id: string
    name: string
  } | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
  // Additional fields
  gramasi?: string | null
  lebar_file?: string | null
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

// Schema for the design process form
const designProcessSchema = z.object({
  // Paper information section - editable
  lebarKertas: z.string().optional(),
  gsmKertas: z.string().optional(),
  fileWidth: z.string().optional(),
  matchingColor: z.enum(["YES", "NO"]),
  // Quantity field - editable
  qty: z.coerce.number().optional(),
  // Design notes
  notes: z.string().optional(),
})

// Type for the design process form values
interface DesignProcessFormValues {
  lebarKertas?: string
  gsmKertas?: string
  fileWidth?: string
  matchingColor: "YES" | "NO"
  qty?: number
  notes?: string
}

export default function DesignPage() {
  const router = useRouter()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<"design" | "process">("design")
  
  // Orders state (Design tab)
  const [orders, setOrders] = useState<DesignOrderItem[]>([])
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
  
  // Process orders state (In Process tab)
  const [processOrders, setProcessOrders] = useState<DesignOrderItem[]>([])
  const [isProcessLoading, setIsProcessLoading] = useState(true)
  const [processSearchQuery, setProcessSearchQuery] = useState("")
  const [processPagination, setProcessPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1
  })
  const [processOrdersSorting, setProcessOrdersSorting] = useState<SortOption>({
    field: "created_at",
    order: "desc"
  })
  
  // User state
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null)
  
  // Design form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DesignOrderItem | null>(null)
  const [produceDialogOpen, setProduceDialogOpen] = useState(false)
  const [editOrderDialogOpen, setEditOrderDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [orderIdToCancel, setOrderIdToCancel] = useState<string | null>(null)
  
  // File upload state
  const [captureFile, setCaptureFile] = useState<File | null>(null)
  const [captureNameFile, setCaptureNameFile] = useState<File | null>(null)
  const [capturePreview, setCapturePreview] = useState<string | null>(null)
  const [captureNamePreview, setCaptureNamePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Initialize design process form
  const form = useForm<DesignProcessFormValues>({
    resolver: zodResolver(designProcessSchema),
    defaultValues: {
      lebarKertas: "",
      gsmKertas: "",
      fileWidth: "",
      matchingColor: "NO",
      qty: undefined,
      notes: "",
    },
  })
  
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        console.log("Fetching current user session...");
        const response = await fetch('/api/auth/session');
        
        if (response.ok) {
          const session = await response.json();
          console.log("Session data:", session);
          
          if (session.user) {
            console.log("User authenticated:", session.user.name);
            setCurrentUser({
              id: session.user.id,
              name: session.user.name
            });
          } else {
            console.warn("No user found in session");
          }
        } else {
          console.error("Failed to fetch session:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Replace the fetchDesignOrders function
  const fetchDesignOrders = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const apiUrl = `/api/design/orders?filter=design&page=${page}&pageSize=${pageSize}&search=${search}`;
      console.log(`Fetching data from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        // Try to get more detailed error info
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.error || '';
        } catch (e) {
          // Could not parse JSON error response
          errorDetail = `Status: ${response.status}`;
        }
        
        throw new Error(`API error: ${errorDetail}`);
      }
      
      const data = await response.json();
      
      // Log successful data
      console.log(`Received ${data.orders?.length || 0} design orders`);
      
      setOrders(data.orders || []);
      setPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      });
    } catch (error) {
      console.error("Error fetching design orders:", error);
      toast.error(`Failed to fetch design orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  
  // Replace the fetchProcessOrders function
  const fetchProcessOrders = useCallback(async (page = 1, search = processSearchQuery) => {
    setIsProcessLoading(true);
    try {
      const apiUrl = `/api/design/orders?filter=process&page=${page}&pageSize=${pageSize}&search=${search}`;
      console.log(`Fetching data from: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        // Try to get more detailed error info
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = errorData.message || errorData.error || '';
        } catch (e) {
          // Could not parse JSON error response
          errorDetail = `Status: ${response.status}`;
        }
        
        throw new Error(`API error: ${errorDetail}`);
      }
      
      const data = await response.json();
      
      // Log successful data
      console.log(`Received ${data.orders?.length || 0} process orders`);
      
      setProcessOrders(data.orders || []);
      setProcessPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      });
    } catch (error) {
      console.error("Error fetching process orders:", error);
      toast.error(`Failed to fetch process orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessOrders([]);
      setProcessPagination({
        totalCount: 0,
        totalPages: 1,
        currentPage: 1
      });
    } finally {
      setIsProcessLoading(false);
    }
  }, [pageSize, processSearchQuery]);
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchQuery])
  
  useEffect(() => {
    setProcessPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [processSearchQuery])
  
  // Fetch orders when pagination, pageSize, searchQuery, or sorting changes
  useEffect(() => {
    fetchDesignOrders(pagination.currentPage, searchQuery)
  }, [pagination.currentPage, pageSize, searchQuery, fetchDesignOrders])
  
  useEffect(() => {
    fetchProcessOrders(processPagination.currentPage, processSearchQuery)
  }, [processPagination.currentPage, pageSize, processSearchQuery, fetchProcessOrders])

  // Initial fetch on component mount
  useEffect(() => {
    fetchDesignOrders(1, searchQuery)
    if (currentUser?.id) {
      fetchProcessOrders(1, processSearchQuery)
    }
  }, [currentUser?.id])
  
  // Handle body overflow when modals are open
  useEffect(() => {
    if (cancelDialogOpen || produceDialogOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [cancelDialogOpen, produceDialogOpen])
  
  // Handle sorting changes for orders
  const handleOrdersSort = (field: string) => {
    setOrdersSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
  }
  
  // Handle sorting changes for process orders
  const handleProcessOrdersSort = (field: string) => {
    setProcessOrdersSorting(prev => ({
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
  
  // Handle search input change for design orders tab
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Debounce the actual search
    debounce(() => {
      fetchDesignOrders(1, value)
    }, 500)()
  }
  
  // Handle search input change for in process tab
  const handleProcessSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setProcessSearchQuery(value)
    
    // Debounce the actual search
    debounce(() => {
      fetchProcessOrders(1, value)
    }, 500)()
  }
  
  // Format date
  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      // First check if it's already an ISO string or another parseable format
      const date = new Date(dateValue);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      
      // Format using date-fns with a consistent format
      return format(date, "dd MMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error, "Value was:", dateValue);
      return "Invalid date"
    }
  }
  
  // Handle page change for design orders tab
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    fetchDesignOrders(newPage, searchQuery)
  }
  
  // Handle page change for in process tab
  const handleProcessPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > processPagination.totalPages) return;
    
    fetchProcessOrders(newPage, processSearchQuery)
  }

  // Handle page size change - affects both tabs
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchDesignOrders(1, searchQuery);
    fetchProcessOrders(1, processSearchQuery);
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
      
      // Update order status to "DESIGN PROCESS"
      await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusm: "DESIGN PROCESS"
        }),
      })
      
      toast.success("Order assigned to you for processing")
      fetchDesignOrders(pagination.currentPage, searchQuery)
      fetchProcessOrders(processPagination.currentPage, processSearchQuery)
      
    } catch (error) {
      console.error("Error processing order:", error)
      toast.error("Failed to process order")
    }
  }
  
  // Handle produce dialog open (for confirmation)
  const handleProduceDialogOpen = (order: DesignOrderItem) => {
    setSelectedOrder(order)
    setProduceDialogOpen(true)
  }
  
  // Handle produce (mark as ready for production)
  const handleProduce = async () => {
    if (!selectedOrder || !currentUser) {
      toast.error("Missing order information or user not logged in")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Update order status to "PRODUCTION"
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusm: "PRODUCTION", // Move to production stage
          status: "READYFORPROD"  // Set order status
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to move order to production")
      }
      
      toast.success("Order moved to production successfully")
      setProduceDialogOpen(false)
      
      // Refresh the process orders list
      fetchProcessOrders(processPagination.currentPage, processSearchQuery)
      
    } catch (error) {
      console.error("Error moving order to production:", error)
      toast.error("Failed to move order to production")
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Upload file using FormData
  const uploadFile = async (file: File, type: 'capture' | 'captureName'): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setUploadProgress(10); // Start upload
      
      // Create FormData
      const formData = new FormData();
      formData.append(type, file);
      
      setUploadProgress(30); // Preparing upload
      
      // Upload to server using the existing upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(70); // Upload in progress
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      
      setUploadProgress(100); // Completed
      
      // Return the URL based on the type of upload
      return type === 'capture' ? data.captureUrl : data.captureNameUrl;
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      toast.error(`Failed to upload ${type === 'capture' ? 'design capture' : 'design name file'}`);
      setUploadProgress(0);
      return null;
    }
  };
  
  // Upload multiple files
  const uploadFiles = async () => {
    const result: { capture?: string; captureName?: string } = {};
    
    try {
      if (captureFile) {
        const captureUrl = await uploadFile(captureFile, 'capture');
        if (captureUrl) {
          result.capture = captureUrl.replace('/uploads/', ''); // Store just the filename
        }
      }
      
      if (captureNameFile) {
        const captureNameUrl = await uploadFile(captureNameFile, 'captureName');
        if (captureNameUrl) {
          result.captureName = captureNameUrl.replace('/uploads/', ''); // Store just the filename
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };
  
  // Process design form submission
  const onSubmitDesign = async (values: DesignProcessFormValues) => {
    if (!selectedOrder || !currentUser) {
      toast.error("Missing order information")
      return
    }
    
    try {
      setIsSubmitting(true)
      setUploadProgress(0)
      
      // Process file uploads if any
      let fileUploadResults: { capture?: string; captureName?: string } = {};
      
      if (captureFile || captureNameFile) {
        try {
          fileUploadResults = await uploadFiles();
        } catch (error) {
          toast.warning("Error uploading files. Design details will be saved without images.");
        }
      }
      
      // Prepare data for the update
      const updateData: Record<string, any> = {
        lebar_kertas: values.lebarKertas,
        gramasi: values.gsmKertas,
        lebar_file: values.fileWidth,
        warna_acuan: values.matchingColor,
        qty: values.qty,
        catatan: values.notes,
        statusm: "DESIGNED", // Mark as designed (ready for production)
      }
      
      // Add file paths if they were uploaded successfully
      if (fileUploadResults.capture) {
        updateData.capture = fileUploadResults.capture;
      }
      
      if (fileUploadResults.captureName) {
        updateData.capture_name = fileUploadResults.captureName;
      }
      
      // Update order data
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update design")
      }
      
      // Success!
      toast.success("Design updated successfully")
      setEditOrderDialogOpen(false)
      
      // Reset form and file states
      form.reset()
      setCaptureFile(null)
      setCaptureNameFile(null)
      setCapturePreview(null)
      setCaptureNamePreview(null)
      
      // Refresh the in-process orders list
      fetchProcessOrders(processPagination.currentPage, processSearchQuery)
      
    } catch (error) {
      console.error("Error updating design:", error)
      toast.error("Failed to update design")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }
  
  // Handle edit design
  const handleEditDesign = (order: DesignOrderItem) => {
    router.push(`/design/edit/${order.id}`)
  }
  
  const handleCancelDesign = async (orderId: string) => {
    setOrderIdToCancel(orderId);
    const orderToCancel = processOrders.find(order => order.id === orderId);
    setSelectedOrder(orderToCancel || null);
    setCancelDialogOpen(true);
  };

  const confirmCancelDesign = async () => {
    if (!orderIdToCancel || !currentUser) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/orders/${orderIdToCancel}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'DESIGN',
          userId: currentUser.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel design');
      }
      
      toast.success("Design cancelled. The design has been returned to the design queue.");
      
      // Refresh the orders lists
      fetchDesignOrders(1, searchQuery);
      fetchProcessOrders(1, processSearchQuery);
      
    } catch (error) {
      console.error('Error cancelling design:', error);
      toast.error("Failed to cancel design. Please try again.");
    } finally {
      setCancelDialogOpen(false);
      setOrderIdToCancel(null);
      setSelectedOrder(null);
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="container mx-auto space-y-4 h-full flex flex-col overflow-visible">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Design Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (activeTab === "design") {
                fetchDesignOrders(1, searchQuery);
              } else {
                fetchProcessOrders(1, processSearchQuery);
              }
            }}
            className="bg-background/50 border-border/50 hover:bg-background/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs 
        defaultValue="design" 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "design" | "process")}
        className="w-full"
      >
        <TabsList className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6grid grid-cols-2 max-w-[400px] mb-4">
          <TabsTrigger value="design">Design Orders</TabsTrigger>
          <TabsTrigger value="process">In Process</TabsTrigger>
        </TabsList>
        
        {/* Design Orders Tab Content */}
        <TabsContent value="design" className="space-y-4">
          {/* Search box for Design Orders */}
      <div className="py-4 bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
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
                    fetchDesignOrders(1, searchQuery);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      
          {/* Design Orders Table */}
      <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 flex-1 flex flex-col overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Design Orders</CardTitle>
          <CardDescription>
                Orders waiting to be processed by designers.
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
                  <TableHeader className="sticky top-0 bg-background/50 z-10">
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
                                : "No design orders found. All orders are being processed."}
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
                            <CaptureThumbnails
                              capture={order.capture}
                              captureName={order.capture_name}
                              altText={order.nama_produk || "Design"}
                            />
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
                  
                  {/* Pagination Controls for Design Orders */}
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
        </TabsContent>
        
        {/* In Process Tab Content */}
        <TabsContent value="process" className="space-y-4">
          {/* Search box for In Process */}
          <div className="py-4 bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
            <div className="container px-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in-process designs by SPK, customer, product..."
                    className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                    value={processSearchQuery}
                    onChange={handleProcessSearchChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
                  onClick={() => {
                    setProcessSearchQuery("");
                    fetchProcessOrders(1, processSearchQuery);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          
          {/* In Process Table */}
          <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 flex-1 flex flex-col overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle>In-Process Designs</CardTitle>
              <CardDescription>
                Design orders you are currently working on.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-visible">
              {isProcessLoading ? (
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
                      <TableHeader className="sticky top-0 bg-background/50 z-10">
                        <TableRow>
                          <SortableTableHead field="created_at" sorting={processOrdersSorting} onSort={handleProcessOrdersSort}>Date</SortableTableHead>
                          <SortableTableHead field="spk" sorting={processOrdersSorting} onSort={handleProcessOrdersSort}>SPK</SortableTableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Customer</TableHead>
                          <SortableTableHead field="produk" sorting={processOrdersSorting} onSort={handleProcessOrdersSort}>Product</SortableTableHead>
                          <TableHead>Product Name</TableHead>
                          <SortableTableHead field="qty" sorting={processOrdersSorting} onSort={handleProcessOrdersSort}>Length</SortableTableHead>
                          <TableHead>Fabric Width</TableHead>
                          <TableHead>Paper Width</TableHead>
                          <TableHead>Color Matching</TableHead>
                          <TableHead>PATH</TableHead>
                          <TableHead>Capture</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processOrders.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={14} className="text-center py-6 text-muted-foreground">
                              {processSearchQuery 
                                ? "No in-process designs match your search criteria" 
                                : "You don't have any designs in progress. Process a design from the Design Orders tab."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          processOrders.map((order) => (
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
                              <TableCell>
                                <Badge
                                  variant={order.statusm === "DESIGN" ? "secondary" : 
                                         order.statusm === "DESIGN PROCESS" ? "outline" : 
                                         "default"}
                                  className={cn(
                                    "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                                    order.statusm === "DESIGN" ? "bg-amber-100 text-amber-800" :
                                    order.statusm === "DESIGN PROCESS" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  )}
                                >
                                  {order.statusm === "DESIGN" && "Pending"}
                                  {order.statusm === "DESIGN PROCESS" && "In Process"}
                                  {order.statusm === "DESIGNED" && "Completed"}
                                </Badge>
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
                              <TableCell>
                                <CaptureThumbnails
                                  capture={order.capture}
                                  captureName={order.capture_name}
                                  altText={order.nama_produk || "Design"}
                                />
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
                                  {/* Edit button */}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditDesign(order)}
                                    className="h-8 px-2 text-xs"
                                  >
                                    <Pencil className="h-3.5 w-3.5 mr-1" />
                                    Edit
                                  </Button>
                                  
                                  {/* Produce button - only shown if status is "DESIGNED" */}
                                  {order.statusm === "DESIGNED" && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleProduceDialogOpen(order)}
                                      className="h-8 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                    >
                                      <ArrowUpRight className="h-3.5 w-3.5 mr-1" />
                                      Produce
                                    </Button>
                                  )}
                                  
                                  {/* Cancel Design button */}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleCancelDesign(order.id)}
                                    className="h-8 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                  
                                  {/* View button */}
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
                  
                  {/* Pagination Controls for In-Process */}
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{processOrders.length}</span> of{" "}
                        <span className="font-medium">{processPagination.totalCount}</span> in-process designs
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleProcessPageChange(1)}
                        disabled={processPagination.currentPage === 1 || isProcessLoading}
                      >
                        <span className="sr-only">First page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleProcessPageChange(processPagination.currentPage - 1)}
                        disabled={processPagination.currentPage === 1 || isProcessLoading}
                      >
                        <span className="sr-only">Previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm font-medium">
                        Page {processPagination.currentPage} of {processPagination.totalPages || 1}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleProcessPageChange(processPagination.currentPage + 1)}
                        disabled={processPagination.currentPage >= processPagination.totalPages || isProcessLoading}
                      >
                        <span className="sr-only">Next page</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleProcessPageChange(processPagination.totalPages)}
                        disabled={processPagination.currentPage >= processPagination.totalPages || isProcessLoading}
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
        </TabsContent>
      </Tabs>
      
      {/* Cancel Confirmation Dialog */}
      {cancelDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setCancelDialogOpen(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-md mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <h2 className="text-lg font-semibold">Cancel Design Process</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCancelDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to cancel this design process? 
                This will return the order to the design queue and any unsaved progress may be lost.
              </p>
              
              <div className="rounded-md border divide-y bg-background/50">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Order SPK</p>
                  <p className="text-sm">{selectedOrder?.spk || "N/A"}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm">{selectedOrder?.customer?.nama || "N/A"}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm">{selectedOrder?.produk || "N/A"}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCancelDialogOpen(false)} 
                  disabled={isSubmitting}
                  className="bg-background/50"
                >
                  Keep Working
                </Button>
                <Button 
                  onClick={confirmCancelDesign} 
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                >
                  {isSubmitting ? "Processing..." : "Cancel Design"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Produce Confirmation Dialog */}
      {produceDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setProduceDialogOpen(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-md mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <h2 className="text-lg font-semibold">Move to Production</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setProduceDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to move this design to production? 
                This will mark the design as complete and ready for the production team.
              </p>
              
              <div className="rounded-md border divide-y bg-background/50">
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Order SPK</p>
                  <p className="text-sm">{selectedOrder?.spk || "N/A"}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm">{selectedOrder?.customer?.nama || "N/A"}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm">{selectedOrder?.produk || "N/A"}</p>
                </div>
                {!selectedOrder?.capture && (
                  <div className="px-4 py-3 bg-amber-50">
                    <div className="flex items-center text-amber-800">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <p className="text-sm font-medium">Warning: No design capture uploaded</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setProduceDialogOpen(false)} 
                  disabled={isSubmitting}
                  className="bg-background/50"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleProduce} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 