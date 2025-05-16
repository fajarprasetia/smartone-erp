"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Search, Pencil, Trash2, AlertCircle, X } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Camera as VisionCamera } from 'react-native-vision-camera'

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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AddPaperForm } from "@/components/inventory/consumables/paper/add-paper-form"
import { EditPaperForm } from "@/components/inventory/consumables/paper/edit-paper-form"

// Define interfaces
interface PaperStock {
  id: string
  barcode_id: string | null
  qrCode: string | null
  supplier: string | null
  manufacturer: string | null
  gsm: string | number
  width: string | number
  height: string | number
  length: string | number | null
  used: string | null
  waste: string | null
  remaining_length: string
  remainingLength: string | number | null
  addedByUserId: string
  added_by: string
  taken_by: string | null
  notes: string | null
  availability: "YES" | "NO"
  created_at: string
  dateAdded: string
  updated_by: string
  user_name?: string
  paper_type?: string
  type?: string
  paperType?: string
  approved: boolean
  name: string
}

// Form schema for adding paper
const addPaperSchema = z.object({
  barcode_id: z.string().optional(),
  supplier: z.string().optional(),
  paper_type: z.string().min(1, { message: "Paper type is required" }),
  gsm: z.string().min(1, { message: "GSM is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  remaining_length: z.string().min(1, { message: "Remaining length is required" }),
  notes: z.string().optional(),
  created_at: z.date().optional(),
})

type AddPaperFormValues = z.infer<typeof addPaperSchema>

export function PaperAvailableTab() {
  const router = useRouter()
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isAddPaperDialogOpen, setIsAddPaperDialogOpen] = useState(false)
  const [isEditPaperDialogOpen, setIsEditPaperDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<PaperStock | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState<string>("")
  const cameraRef = useRef(null)

  // Initialize form
  const addPaperForm = useForm<AddPaperFormValues>({
    resolver: zodResolver(addPaperSchema),
    defaultValues: {
      barcode_id: "",
      supplier: "",
      paper_type: "Sublimation Paper",
      gsm: "",
      width: "",
      length: "",
      remaining_length: "",
      notes: "",
      created_at: new Date(),
    },
  })

  // Fetch paper stocks
  const fetchPaperStocks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/inventory/paper?availability=YES');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setPaperStocks(data);
    } catch (error) {
      console.error("Error fetching paper stocks:", error);
      toast.error("Failed to load paper stocks");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchPaperStocks();
  }, []);

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    setScannedBarcode(barcode);
    addPaperForm.setValue("barcode_id", barcode);
    setIsScannerOpen(false);
    toast.success(`Barcode scanned: ${barcode}`);
  };

  // Handle edit paper
  const handleEditPaper = (stock: PaperStock) => {
    setSelectedStock(stock);
    setIsEditPaperDialogOpen(true);
  };

  // Handle delete paper
  const handleDeletePaper = (stock: PaperStock) => {
    setSelectedStock(stock);
    setIsDeleteDialogOpen(true);
  };

  // Handle edit paper form submission
  const onEditPaperSubmit = async (data: Omit<AddPaperFormValues, 'remaining_length'> & { remaining_length: string }) => {
    if (!selectedStock) return Promise.reject(new Error("No stock selected"));
    
    try {
      // Make sure we have all required fields
      if (!data.paper_type || !data.gsm || !data.width || !data.length) {
        toast.error("Please fill in all required fields");
        return Promise.reject(new Error("Missing required fields"));
      }
      
      console.log("Updating paper data:", data);
      
      const response = await fetch(`/api/inventory/paper/${selectedStock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMsg = responseData.details || responseData.error || `Error: ${response.status}`;
        console.error("API error:", errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Successfully updated paper stock
      await fetchPaperStocks(); // Refresh the list
      toast.success("Paper stock updated successfully");
      setIsEditPaperDialogOpen(false);
      return Promise.resolve();
    } catch (error) {
      console.error("Error updating paper stock:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update paper stock";
      toast.error(errorMessage);
      return Promise.reject(error);
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedStock) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/inventory/paper/${selectedStock.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      toast.success("Paper stock deleted successfully");
      setIsDeleteDialogOpen(false);
      await fetchPaperStocks(); // Refresh the list
    } catch (error) {
      console.error("Error deleting paper stock:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete paper stock");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add paper form submission
  const onAddPaperSubmit = async (data: AddPaperFormValues & { remaining_length: string }) => {
    try {
      // Make sure we have all required fields
      if (!data.paper_type || !data.gsm || !data.width || !data.length) {
        toast.error("Please fill in all required fields");
        return Promise.reject(new Error("Missing required fields"));
      }
      
      // Format data to match the API and schema expectations
      const formattedData = {
        name: `${data.paper_type} ${data.gsm}gsm ${data.width}x${data.length}cm`,
        paper_type: data.paper_type,
        type: data.paper_type,
        gsm: data.gsm,
        width: data.width,
        length: data.length,
        height: data.width, // Use width as height by default
        thickness: null,
        remainingLength: data.remaining_length || data.length,
        remaining_length: data.remaining_length || data.length,
        barcode_id: data.barcode_id,
        qrCode: data.barcode_id,
        manufacturer: data.supplier,
        supplier: data.supplier,
        notes: data.notes,
        dateAdded: data.created_at?.toISOString(),
        availability: "YES",
        approved: true
      };
      
      console.log("Submitting paper data:", formattedData);
      
      const response = await fetch('/api/inventory/paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        const errorMsg = responseData.details || responseData.error || `Error: ${response.status}`;
        console.error("API error:", errorMsg);
        toast.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Successfully added paper stock
      await fetchPaperStocks(); // Refresh the list
      toast.success("Paper stock added successfully");
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding paper stock:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add paper stock";
      toast.error(errorMessage);
      return Promise.reject(error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Filter stocks by search query
  const filteredStocks = paperStocks.filter(stock => 
    (stock.barcode_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.supplier?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    // Convert gsm to string before calling toLowerCase()
    (stock.gsm?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stock.width?.toString() || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (stock.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search paper stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsAddPaperDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Add Paper
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Paper Type</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Waste</TableHead>
              <TableHead>Remaining Length</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-6 text-muted-foreground">
                  No paper stocks found
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>{stock.barcode_id || stock.qrCode || "N/A"}</TableCell>
                  <TableCell>{stock.supplier || stock.manufacturer || "N/A"}</TableCell>
                  <TableCell>{stock.type || stock.paperType || stock.paper_type || "Sublimation Paper"}</TableCell>
                  <TableCell>{stock.gsm}</TableCell>
                  <TableCell>{stock.width}</TableCell>
                  <TableCell>{stock.length}</TableCell>
                  <TableCell>{stock.used || "0"}</TableCell>
                  <TableCell>{stock.waste || "0"}</TableCell>
                  <TableCell>{stock.remainingLength || stock.remaining_length}</TableCell>
                  <TableCell>{stock.user_name || "N/A"}</TableCell>
                  <TableCell>{formatDate(stock.dateAdded || stock.created_at)}</TableCell>
                  <TableCell className="max-w-xs truncate">{stock.notes || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditPaper(stock)}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeletePaper(stock)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Add Paper Form */}
      <AddPaperForm
        open={isAddPaperDialogOpen}
        onOpenChange={setIsAddPaperDialogOpen}
        onSubmit={onAddPaperSubmit}
      />

      {/* Edit Paper Form */}
      {selectedStock && (
        <EditPaperForm
          open={isEditPaperDialogOpen}
          onOpenChange={setIsEditPaperDialogOpen}
          onSubmit={onEditPaperSubmit}
          stock={selectedStock}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsDeleteDialogOpen(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold">Delete Paper Stock</h2>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              {selectedStock && (
                <div className="space-y-4 mb-6">
                  <div className="p-4 border rounded-md bg-destructive/5 border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                      <div>
                        <h3 className="font-medium text-sm">Confirm Deletion</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Are you sure you want to delete this paper stock? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-4 border rounded-md bg-muted/30">
                    <h3 className="text-sm font-medium">Paper Stock Details</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Barcode ID</p>
                        <p className="text-sm">{selectedStock.barcode_id || selectedStock.qrCode || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Paper Type</p>
                        <p className="text-sm">{selectedStock.type || selectedStock.paperType || selectedStock.paper_type || "Sublimation Paper"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">GSM</p>
                        <p className="text-sm">{selectedStock.gsm} GSM</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Dimensions</p>
                        <p className="text-sm">{selectedStock.width}x{selectedStock.length}cm</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleConfirmDelete}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                      Deleting...
                    </>
                  ) : (
                    <>Delete Paper Stock</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 