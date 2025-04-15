"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Search, RefreshCw, X, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Uploader, UploadButton } from 'react-uploader';
import { Camera } from 'react-native-vision-camera';

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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
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
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Loader2 } from "lucide-react"
import {
  CustomPopover,
  CustomPopoverContent,
  CustomPopoverTrigger 
} from "@/components/ui/custom-popover"

// Define the inventory item interface
interface InventoryItem {
  id: string | number
  asal_bahan: string | null
  nama_bahan: string | null
  lebar_bahan: string | null
  berat_bahan: string | null
  est_pjg_bahan: string | null
  tanggal: string | null
  foto: string | null
  roll: string | null
  keterangan: string | null
  customer_name?: string
}

// Define pagination interface
interface Pagination {
  total: number
  pageCount: number
  page: number
  pageSize: number
}

// Define the form schema with validation
const formSchema = z.object({
  asal_bahan: z.string().optional(),
  nama_bahan: z.string().min(1, { message: "Fabric name is required" }),
  lebar_bahan: z.string().optional(),
  berat_bahan: z.string().optional(),
  est_pjg_bahan: z.string().optional(),
  tanggal: z.date().optional(),
  foto: z.string().optional(),
  images: z.array(z.instanceof(File)).optional(),
  roll: z.string().optional(),
  keterangan: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Customer interface
interface Customer {
  id: string
  name: string
}

// Page size options
const pageSizeOptions = [10, 20, 50, 100];

// InboundFormDialog component
// Import the InboundForm component
import { InboundForm } from "@/components/inventory/inbound-form"
import { CustomerFormDialogNew } from "@/components/marketing/customer-form-dialog-new"

export default function InventoryInboundPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'}>({key: '', direction: 'asc'})
  
  // Handle form submission
  const handleFormSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      
      // Format data to uppercase as required
      formData.append('nama_bahan', data.nama_bahan.toUpperCase());
      formData.append('asal_bahan', data.asal_bahan || '');
      formData.append('lebar_bahan', data.lebar_bahan?.toUpperCase() || '');
      formData.append('berat_bahan', data.berat_bahan?.toUpperCase() || '');
      formData.append('est_pjg_bahan', data.est_pjg_bahan?.toUpperCase() || '');
      formData.append('roll', data.roll?.toUpperCase() || '');
      formData.append('keterangan', data.keterangan?.toUpperCase() || '');
      
      if (data.tanggal) {
        formData.append('tanggal', data.tanggal.toISOString());
      }
      
      // Handle images from the InboundForm component
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((imageData: any) => {
          // Convert base64 to blob if needed
          if (imageData.fileUrl && imageData.fileUrl.startsWith('data:')) {
            const blob = dataURLtoBlob(imageData.fileUrl);
            formData.append('files', blob, imageData.fileName);
          } else if (imageData.fileUrl) {
            // For URLs that are already uploaded
            formData.append('foto', imageData.fileUrl);
          }
        });
      }
      
      const response = await fetch("/api/inventory/inbound", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to create inventory item")
      }
      
      // Show success toast notification
      toast.success("Inventory item added successfully")
      
      // Close the dialog
      setIsAddDialogOpen(false)
      
      // Reset search query to ensure new item appears in the list
      setSearchQuery("");
      
      // Refresh the inventory list
      fetchInventory(1, pageSize);
    } catch (error) {
      console.error("Error creating inventory item:", error)
      toast.error("Failed to add inventory item")
    }
  }
  
  // Helper function to convert data URL to Blob
  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pageCount: 0,
    page: 1,
    pageSize: 10
  })
  const [pageSize, setPageSize] = useState(10)
  
  // Fetch customers for the source dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/marketing/customers")
        
        if (!response.ok) {
          throw new Error("Failed to fetch customers")
        }
        
        const data = await response.json()
        setCustomers(data)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error("Failed to load customers")
      }
    }
    
    fetchCustomers()
  }, [])
  
  // Fetch inventory items with search support
  const fetchInventory = async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: searchQuery.trim()
      });

      const response = await fetch(`/api/inventory/inbound?${params.toString()}`);
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || 'Failed to fetch inventory');
}
      
      const data = await response.json();
      setItems(data.items);
      setFilteredItems(data.items);
      setPagination(data.pagination);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast.error("Failed to load inventory items")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  }, [searchQuery])

  useEffect(() => {
    fetchInventory(pagination.page, pageSize, searchQuery)
  }, [pagination.page, pageSize, searchQuery])
  
  // Handle sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({key, direction})

    const sortedItems = [...filteredItems].sort((a, b) => {
      const aValue = a[key as keyof InventoryItem] || ''
      const bValue = b[key as keyof InventoryItem] || ''
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1
      if (aValue > bValue) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredItems(sortedItems)
  }

  // Add client-side filtering effect
  

  // Update the search input handlers
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
      total: filteredItems.length
    }));
  }
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPagination(prev => ({
      ...prev,
      pageSize: newSize,
      pageCount: Math.ceil(filteredItems.length / newSize)
    }));
  }

  return (
    <div className="container mx-auto space-y-4 h-full flex flex-col overflow-visible">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Inbound</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchInventory(1, pageSize)}
            className="bg-background/50 border-border/50 hover:bg-background/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            className="bg-primary/90 hover:bg-primary text-primary-foreground"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Item
          </Button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="py-4 bg-background/80 backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="default" 
                className="bg-primary/90 hover:bg-primary text-primary-foreground"
                onClick={() => fetchInventory(1, pageSize, searchQuery)}
              >
                <Search className="h-4 w-4 mr-2" /> Search
              </Button>
            </div>
            <Button 
              variant="outline" 
              className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
              onClick={() => {
                setSearchQuery("");
                fetchInventory(1, pageSize, "");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-visible">
        <CardHeader className="pb-2">
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Manage your fabric inventory and track inbound items.
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
                      <TableHead 
                        className="w-[20%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('nama_bahan')}
                      >
                        Fabric Name
                        {sortConfig.key === 'nama_bahan' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[15%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('customer_name')}
                      >
                        Source/Customer
                        {sortConfig.key === 'customer_name' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[10%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('lebar_bahan')}
                      >
                        Width
                        {sortConfig.key === 'lebar_bahan' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[10%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('berat_bahan')}
                      >
                        Weight
                        {sortConfig.key === 'berat_bahan' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[10%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('est_pjg_bahan')}
                      >
                        Est. Length
                        {sortConfig.key === 'est_pjg_bahan' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[10%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('roll')}
                      >
                        Roll
                        {sortConfig.key === 'roll' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead 
                        className="w-[10%] cursor-pointer hover:bg-muted/50" 
                        onClick={() => handleSort('tanggal')}
                      >
                        Date
                        {sortConfig.key === 'tanggal' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </TableHead>
                      <TableHead className="w-[15%]">Notes</TableHead>
                      <TableHead className="w-[10%]">Capture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          {searchQuery 
                            ? "No items match your search criteria" 
                            : "No inventory items found. Add an item to get started!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow 
                          key={item.id} 
                          className="hover:bg-muted/50 h-14"
                        >
                          <TableCell className="font-medium py-3">{item.nama_bahan || "N/A"}</TableCell>
                          <TableCell className="py-3">{item.customer_name || "N/A"}</TableCell>
                          <TableCell className="py-3">{item.lebar_bahan || "N/A"}</TableCell>
                          <TableCell className="py-3">{item.berat_bahan || "N/A"}</TableCell>
                          <TableCell className="py-3">{item.est_pjg_bahan || "N/A"}</TableCell>
                          <TableCell className="py-3">{item.roll || "N/A"}</TableCell>
                          <TableCell className="py-3">{formatDate(item.tanggal)}</TableCell>
                          <TableCell className="max-w-xs truncate py-3">
                            {item.keterangan || "N/A"}
                          </TableCell>
                          <TableCell className="py-3">
                            {item.foto ? (
                              <img 
                                src={item.foto} 
                                alt="Fabric capture" 
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : "N/A"}
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
                    Showing <span className="font-medium">{filteredItems.length}</span> of{" "}
                    <span className="font-medium">{pagination.total}</span> items
                  </p>
                  
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                  >
                    <SelectTrigger className="h-8 w-[80px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    <span className="sr-only">First page</span>
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    <span className="sr-only">Previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm font-medium">
                    Page {pagination.page} of {pagination.pageCount || 1}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pageCount || isLoading}
                  >
                    <span className="sr-only">Next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.pageCount)}
                    disabled={pagination.page >= pagination.pageCount || isLoading}
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
      
      {/* Add New Item Dialog */}
      <InboundForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        customers={customers}
        onSubmit={handleFormSubmit}
      />
    </div>
  )
}

// Remove the FormField component that's causing the error