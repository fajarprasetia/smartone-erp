"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Search, RefreshCw, X, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"

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

export default function InventoryInboundPage() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [comboboxOpen, setComboboxOpen] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pageCount: 0,
    page: 1,
    pageSize: 10
  })
  const [pageSize, setPageSize] = useState(10)
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asal_bahan: "",
      nama_bahan: "",
      lebar_bahan: "",
      berat_bahan: "",
      est_pjg_bahan: "",
      tanggal: new Date(),
      foto: "",
      roll: "",
      keterangan: "",
    },
  })
  
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
  
  // Fetch inventory items
  const fetchInventory = async (page = 1, pageSize = 10) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/inventory/inbound?page=${page}&pageSize=${pageSize}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch inventory")
      }
      
      const data = await response.json()
      setItems(data.items)
      setFilteredItems(data.items)
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast.error("Failed to load inventory items")
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchInventory(pagination.page, pageSize)
  }, [pagination.page, pageSize])
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase()
      const filtered = items.filter(item => 
        (item.nama_bahan && item.nama_bahan.toLowerCase().includes(lowercaseQuery)) ||
        (item.customer_name && item.customer_name.toLowerCase().includes(lowercaseQuery)) ||
        (item.roll && item.roll.toLowerCase().includes(lowercaseQuery)) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(lowercaseQuery))
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems(items)
    }
  }, [searchQuery, items])
  
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
    // Don't allow navigation to invalid pages
    if (newPage < 1 || newPage > pagination.pageCount) return;
    
    // Clear search when changing pages
    if (searchQuery) setSearchQuery("");
    
    // Fetch the new page
    fetchInventory(newPage, pageSize);
  }
  
  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    // Reset to first page when changing page size
    fetchInventory(1, newSize);
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsAddingItem(true)
      
      const response = await fetch("/api/inventory/inbound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create inventory item")
      }
      
      toast.success("Inventory item added successfully")
      
      // Close the dialog and reset the form
      setIsAddDialogOpen(false)
      form.reset({
        asal_bahan: "",
        nama_bahan: "",
        lebar_bahan: "",
        berat_bahan: "",
        est_pjg_bahan: "",
        tanggal: new Date(),
        foto: "",
        roll: "",
        keterangan: "",
      })
      
      // Refresh the inventory list
      fetchInventory(1, pageSize)
    } catch (error) {
      console.error("Error creating inventory item:", error)
      toast.error("Failed to add inventory item")
    } finally {
      setIsAddingItem(false)
    }
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
            onClick={() => router.push("/inventory/inbound/add")}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Item
          </Button>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="py-4 bg-background/80 backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row gap-4">
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
              variant="outline" 
              className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
              onClick={() => {
                setSearchQuery("");
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
                      <TableHead className="w-[20%]">Fabric Name</TableHead>
                      <TableHead className="w-[15%]">Source/Customer</TableHead>
                      <TableHead className="w-[10%]">Width</TableHead>
                      <TableHead className="w-[10%]">Weight</TableHead>
                      <TableHead className="w-[10%]">Est. Length</TableHead>
                      <TableHead className="w-[10%]">Roll</TableHead>
                      <TableHead className="w-[10%]">Date</TableHead>
                      <TableHead className="w-[15%]">Notes</TableHead>
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
    </div>
  )
} 