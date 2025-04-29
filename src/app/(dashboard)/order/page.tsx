"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Ban, 
  Banknote, 
  Check, 
  CreditCard, 
  DollarSign, 
  Eye, 
  Pencil, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  Search, 
  FileEdit, 
  Trash2, 
  ClipboardList,
  PlusCircle,
  RefreshCw,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  XCircle,
  Truck,
  Printer,
  Calendar as CalendarIcon,
  X,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Receipt
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { debounce } from "lodash"
import Image from "next/image"
import { FallbackImage } from "@/components/ui/fallback-image"

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
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DialogModal } from "@/components/ui/dialog-modal"
import { CaptureThumbnails } from "@/components/design/capture-thumbnails"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { formatCurrency } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the OrderItem interface based on requirements
interface OrderItem {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | null
  created_at?: Date | null
  produk?: string | null
  asal_bahan?: string | null
  asal_bahan_id?: string | null
  customer_id?: number | null
  status?: string | null
  statusm?: string | null
  qty?: number | null
  catatan?: string | null
  marketing?: string | null // String field from database
  marketingInfo?: { // Added from API processing
    name: string
  } | null
  marketingUser?: {
    name: string
  } | null
  originCustomer?: {
    id: string
    nama: string
  } | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
  path?: string | null
  est_order?: Date | null
  invoice?: string | null
  nama_kain?: string | null
  kategori?: string | null
  lebar_kain?: string | null
  gramasi?: string | null
  lebar_file?: string | null
  lebar_kertas?: string | null
  catatan_design?: string | null
  capture?: string | null
  capture_name?: string | null
  nominal?: number | null
  dp?: number | null
  sisa?: number | null
  tgl_dp?: Date | null
  tgl_lunas?: Date | null
  jenis_pembayaran?: string | null
  tf_dp?: string | null
  tf_pelunasan?: string | null
  catatan_tf?: string | null
  biaya_tambahan?: string | null
  approval?: string | null
  keterangan?: string | null // Field used for invoice status (SUDAH/BELUM DIINVOICEKAN)
}

// Payment Form Data interface
interface PaymentFormData {
  date: Date
  paymentMethod: string
  payment: number
  notes: string
  file?: File | null
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

// Add debounce function to prevent excessive API calls
const debouncedSearch = debounce((value: string, isForDrafts = false) => {
  // Implementation of debounce function
}, 500)

// Define a type for sorting options
interface SortOption {
  field: string
  order: "asc" | "desc"
}

// OrderSpkModal component to display order details in a popover/modal
const OrderSpkModal = ({ order, open, onOpenChange }: { 
  order: OrderItem | null, 
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) => {
  if (!order) return null;

  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      return format(new Date(dateValue), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  const handlePrint = () => {
    window.print();
  }

  return (
    <DialogModal 
      open={open} 
      onOpenChange={onOpenChange}
      title={`Order Details: ${order.spk || "N/A"}`}
      description={`View details for order ${order.no_project || ""}`}
      maxWidth="2xl"
    >
      <div className="p-0 overflow-y-auto max-h-[70vh]">
        {/* SPK Document - full details */}
        <div className="bg-background rounded-md overflow-hidden print-container print:bg-white">
          {/* Section 1: Header Info */}
          <div className="border border-border rounded-md p-4 mb-4 print:border-gray-300">
            <h3 className="text-md font-semibold mb-3 pb-1 border-b border-border print:border-gray-300">Order Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">SPK Number</p>
                <p className="text-base font-semibold text-foreground">
                  {order.spk || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project Number</p>
                <p className="text-base font-semibold text-foreground">
                  {order.no_project || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(order.created_at || order.tanggal)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Completion</p>
                <p className="text-base font-semibold text-foreground">
                  {formatDate(order.est_order)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <div className="mt-1 text-foreground">
                  {getStatusBadge(order.status || order.statusm)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invoice</p>
                <p className="text-base font-semibold text-foreground">
                  {order.invoice || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Customer Info */}
          <div className="border border-border rounded-md p-4 mb-4 print:border-gray-300">
            <h3 className="text-md font-semibold mb-3 pb-1 border-b border-border print:border-gray-300">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                <p className="text-base font-semibold text-foreground">
                  {order.customer?.nama || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-base font-semibold text-foreground">
                Certainly! You need to ensure that order.customer?.telp is properly checked for null or undefined before concatenating with "62". Try modifying your code like this:
              {order.customer?.telp
                  ? order.customer.telp
                      ? `62${order.customer.telp.startsWith('8') ? order.customer.telp : order.customer.telp.replace(/^0+/, '')}`
                      : "N/A"
                  : "N/A"}

                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Marketing</p>
                <p className="text-base font-semibold text-foreground">
                  {order.marketingUser?.name || order.marketingInfo?.name || order.marketing || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Asal Bahan</p>
                <p className="text-base font-semibold text-foreground">
                  {order.originCustomer?.nama || order.asal_bahan || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Product Info */}
          <div className="border border-border rounded-md p-4 mb-4 print:border-gray-300">
            <h3 className="text-md font-semibold mb-3 pb-1 border-b border-border print:border-gray-300">Product Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product</p>
                <p className="text-base font-semibold text-foreground">
                  {order.produk || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                <p className="text-base font-semibold text-foreground">
                  {order.qty || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nama Kain</p>
                <p className="text-base font-semibold text-foreground">
                  {order.nama_kain || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                <p className="text-base font-semibold text-foreground">
                  {order.kategori || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lebar Kain</p>
                <p className="text-base font-semibold text-foreground">
                  {order.lebar_kain || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gramasi</p>
                <p className="text-base font-semibold text-foreground">
                  {order.gramasi || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lebar File</p>
                <p className="text-base font-semibold text-foreground">
                  {order.lebar_file || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lebar Kertas</p>
                <p className="text-base font-semibold text-foreground">
                  {order.lebar_kertas || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Notes and Comments */}
          <div className="border border-border rounded-md p-4 mb-4 print:border-gray-300">
            <h3 className="text-md font-semibold mb-3 pb-1 border-b border-border print:border-gray-300">Notes</h3>
            <div className="mb-3">
              <p className="text-sm font-medium text-muted-foreground">General Notes</p>
              <p className="text-base font-semibold bg-muted/50 text-foreground p-2 rounded-md print:bg-gray-100">
                {order.catatan || "No notes provided"}
              </p>
            </div>
            {order.catatan_design && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Design Notes</p>
                <p className="text-base font-semibold bg-muted/50 p-2 rounded-md text-red-600 print:bg-gray-100">
                  {order.catatan_design}
                </p>
              </div>
            )}
          </div>
          
          {/* Section 5: Preview and Attachments */}
          {(order.path || order.capture || order.capture_name) && (
            <div className="border border-border rounded-md p-4 mb-4 print:border-gray-300">
              <h3 className="text-md font-semibold mb-3 pb-1 border-b border-border print:border-gray-300">Attachments & Previews</h3>
              
              {order.path && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground">File Path</p>
                  <p className="text-base font-semibold text-foreground">
                    {order.path}
                  </p>
                </div>
              )}
              
              {order.capture && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-muted-foreground">Design Preview</p>
                  <div className="bg-muted/50 rounded-md p-2 mt-1 flex justify-center print:bg-gray-100">
                    <div className="relative h-[150px] w-[200px]">
                      <FallbackImage
                        src={`/uploads/${order.capture}`}
                        alt="Design preview"
                        width={200}
                        height={150}
                        className="object-contain max-h-[150px]"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {order.capture_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name Preview</p>
                  <div className="bg-muted/50 rounded-md p-2 mt-1 flex justify-center print:bg-gray-100">
                    <div className="relative h-[100px] w-[240px]">
                      <FallbackImage
                        src={`/uploads/${order.capture_name}`}
                        alt="Name preview"
                        width={240}
                        height={100}
                        className="object-contain max-h-[100px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/order/view/${order.id}`, '_blank')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Full Details
            </Button>
            <Button 
              size="sm"
              onClick={() => window.open(`/order/edit/${order.id}`, '_blank')}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit Order
            </Button>
          </div>
        </div>
      </div>
    </DialogModal>
  );
};

// DP Payment Form
const DpPaymentForm = ({ order, onSuccess }: { order: OrderItem, onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date(),
    paymentMethod: "Transfer",
    payment: order.nominal ? Math.ceil(order.nominal / 2) : 0,
    notes: "",
    file: null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.payment) {
      toast.error("Please enter a payment amount")
      return
    }
    
    if (!formData.file && formData.paymentMethod === "Transfer") {
      toast.error("Please upload a transfer receipt")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create form data for file upload
      const formUploadData = new FormData()
      if (formData.file) {
        formUploadData.append('file', formData.file)
      }
      
      // Upload file if exists
      let uploadedFilePath = null
      if (formData.file) {
        const uploadResp = await fetch('/api/upload?folder=tfuploads', {
          method: 'POST',
          body: formUploadData
        })
        
        if (!uploadResp.ok) {
          throw new Error('File upload failed')
        }
        
        const uploadData = await uploadResp.json()
        uploadedFilePath = uploadData.path
      }
      
      // Update order with payment info using the DP API endpoint
      const updateResp = await fetch(`/api/orders/payment/dp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentDate: formData.date,
          paymentMethod: formData.paymentMethod,
          payment: formData.payment,
          notes: formData.notes,
          receiptPath: uploadedFilePath,
          approval: "APPROVED" // Set approval status when payment is made
        })
      })
      
      if (!updateResp.ok) {
        const errorData = await updateResp.json()
        throw new Error(errorData.error || 'Failed to update order payment')
      }
      
      toast.success("Down payment recorded successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error processing down payment:", error)
      toast.error("Failed to process down payment")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      })
    }
  }
  
  const minDownPayment = order.nominal ? Math.ceil(order.nominal / 2) : 0
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          disabled={!!order.dp || order.biaya_tambahan === "LUNAS" || order.biaya_tambahan === "NO DP"}
        >
          <CreditCard className="h-4 w-4 mr-2" /> DP
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4">
        <form onSubmit={handleSubmit}>
          <h3 className="font-medium text-lg mb-2">Record Down Payment</h3>
          
          <div className="space-y-1 mb-2">
            <p className="text-sm text-muted-foreground">Total Order: <span className="font-semibold text-foreground">{formatCurrency(order.nominal || 0)}</span></p>
            <p className="text-sm text-muted-foreground">Min. Downpayment: <span className="font-semibold text-foreground">{formatCurrency(minDownPayment)}</span></p>
          </div>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dp-date">Payment Date</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => {
                    if (date instanceof Date) {
                      setFormData({...formData, date})
                    }
                  }}
                  disabled={(date: Date) => date < new Date()}
                  initialFocus
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dp-payment-method">Payment Method</Label>
              <Select 
                value={formData.paymentMethod} 
                onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
              >
                <SelectTrigger id="dp-payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.paymentMethod === "Transfer" && (
              <div className="space-y-2">
                <Label htmlFor="dp-receipt">Upload Receipt</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="dp-receipt"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    {formData.file ? formData.file.name : "Select file"}
                  </Button>
                  {formData.file && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setFormData({...formData, file: null})}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="dp-amount">Payment Amount</Label>
              <Input
                id="dp-amount"
                type="number"
                min={minDownPayment}
                value={formData.payment || ""}
                onChange={(e) => setFormData({...formData, payment: parseInt(e.target.value) || 0})}
                placeholder="Enter payment amount"
              />
              {formData.payment < minDownPayment && (
                <p className="text-xs text-red-500">Amount must be at least {formatCurrency(minDownPayment)}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dp-notes">Notes</Label>
              <Textarea
                id="dp-notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Payment notes (optional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (formData.payment < minDownPayment)}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

// Settle Payment Form
const SettlePaymentForm = ({ order, onSuccess }: { order: OrderItem, onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>({
    date: new Date(),
    paymentMethod: "Transfer",
    payment: order.sisa || 0,
    notes: "",
    file: null
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.payment) {
      toast.error("Please enter a payment amount")
      return
    }
    
    if (!formData.file && formData.paymentMethod === "Transfer") {
      toast.error("Please upload a transfer receipt")
      return
    }
    
    // If payment is less than remaining, show confirmation
    if (formData.payment < (order.sisa || 0)) {
      setShowConfirmation(true)
      return
    }
    
    // Otherwise proceed with payment
    await processPayment()
  }
  
  const processPayment = async () => {
    try {
      setIsLoading(true)
      
      // Create form data for file upload
      const formUploadData = new FormData()
      if (formData.file) {
        formUploadData.append('file', formData.file)
      }
      
      // Upload file if exists
      let uploadedFilePath = null
      if (formData.file) {
        const uploadResp = await fetch('/api/upload?folder=tfuploads', {
          method: 'POST',
          body: formUploadData
        })
        
        if (!uploadResp.ok) {
          throw new Error('File upload failed')
        }
        
        const uploadData = await uploadResp.json()
        uploadedFilePath = uploadData.path
      }
      
      // Update order with payment info using the settle API endpoint
      const updateResp = await fetch(`/api/orders/payment/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          paymentDate: formData.date,
          paymentMethod: formData.paymentMethod,
          payment: formData.payment,
          notes: formData.notes,
          receiptPath: uploadedFilePath
        })
      })
      
      if (!updateResp.ok) {
        const errorData = await updateResp.json()
        throw new Error(errorData.error || 'Failed to update order payment')
      }
      
      const responseData = await updateResp.json()
      
      toast.success(responseData.fullyPaid 
        ? "Payment completed successfully" 
        : "Partial payment recorded successfully"
      )
      setShowConfirmation(false)
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.error("Failed to process payment")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      })
    }
  }
  
  const minDownPayment = order.nominal ? Math.ceil(order.nominal / 2) : 0
  
  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setShowConfirmation(false)
      }
      setIsOpen(open)
    }}>
      <PopoverTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          disabled={order.sisa === 0 || order.biaya_tambahan === "LUNAS" || !order.dp}
        >
          <DollarSign className="h-4 w-4 mr-2" /> Settle
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4">
        {showConfirmation ? (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Partial Payment Confirmation</h3>
            <p>You're submitting a payment of {formatCurrency(formData.payment)} which is less than the remaining balance of {formatCurrency(order.sisa || 0)}.</p>
            <p>This will leave a remaining balance of {formatCurrency((order.sisa || 0) - formData.payment)}.</p>
            <p>Would you like to proceed?</p>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelConfirmation}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={processPayment}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="font-medium text-lg mb-2">Settle Payment</h3>
            
            <div className="space-y-1 mb-2">
              <p className="text-sm text-muted-foreground">Total Order: <span className="font-semibold text-foreground">{formatCurrency(order.nominal || 0)}</span></p>
              <p className="text-sm text-muted-foreground">Remaining Payment: <span className="font-semibold text-foreground">{formatCurrency(order.sisa || 0)}</span></p>
              <p className="text-sm text-muted-foreground">Min. Downpayment: <span className="font-semibold text-foreground">{formatCurrency(minDownPayment)}</span></p>
            </div>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="settle-date">Payment Date</Label>
                <div className="border rounded-md p-2">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date instanceof Date) {
                        setFormData({...formData, date})
                      }
                    }}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="settle-payment-method">Payment Method</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                >
                  <SelectTrigger id="settle-payment-method">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.paymentMethod === "Transfer" && (
                <div className="space-y-2">
                  <Label htmlFor="settle-receipt">Upload Receipt</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="settle-receipt"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full justify-start"
                    >
                      {formData.file ? formData.file.name : "Select file"}
                    </Button>
                    {formData.file && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setFormData({...formData, file: null})}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="settle-amount">Payment Amount</Label>
                <Input
                  id="settle-amount"
                  type="number"
                  min={1}
                  max={order.sisa || 0}
                  value={formData.payment || ""}
                  onChange={(e) => setFormData({...formData, payment: parseInt(e.target.value) || 0})}
                  placeholder="Enter payment amount"
                />
                {formData.payment < (order.sisa || 0) && (
                  <p className="text-xs text-amber-500">This is a partial payment. Full payment is {formatCurrency(order.sisa || 0)}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="settle-notes">Notes</Label>
                <Textarea
                  id="settle-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Payment notes (optional)"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || formData.payment <= 0 || formData.payment > (order.sisa || 0)}
                >
                  {isLoading ? "Processing..." : "Confirm"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  )
}

// No DP Form
const NoDpForm = ({ order, onSuccess }: { order: OrderItem, onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const handleConfirm = async () => {
    try {
      setIsLoading(true)
      
      // Use the no-dp API endpoint
      const updateResp = await fetch(`/api/orders/payment/no-dp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          approval: "APPROVED",
          sisa: order.nominal // Set the sisa field to the full order amount (nominal)
        })
      })
      
      if (!updateResp.ok) {
        const errorData = await updateResp.json()
        throw new Error(errorData.error || 'Failed to update order payment status')
      }
      
      toast.success("Order marked as NO DP")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error updating NO DP status:", error)
      toast.error("Failed to update payment status")
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2"
          disabled={!!order.dp || order.biaya_tambahan === "LUNAS" || order.biaya_tambahan === "NO DP"}
        >
          <Ban className="h-4 w-4 mr-2" /> NO DP
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4">
        <div className="space-y-4">
          <h3 className="font-medium text-lg">Confirm No Down Payment</h3>
          <p>No down payment for this order, confirm?</p>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Image Thumbnail component for displaying payment receipts
const ImageThumbnail = ({ 
  src, 
  alt, 
  onClick, 
  useFallback = false,
  order,
  onSuccess
}: { 
  src: string | null | undefined, 
  alt: string, 
  onClick?: () => void, 
  useFallback?: boolean,
  order?: OrderItem,
  onSuccess?: () => void 
}) => {
  if (!src) return null
  
  // Ensure the src URL is properly formatted with a leading slash if it's a relative path
  const formattedSrc = src.startsWith('/') || src.startsWith('http') ? src : `/${src}`
  
  // Determine which prop to pass based on the alt text
  if (alt.includes("DP")) {
    return (
      <div className="flex items-center gap-1">
        <CaptureThumbnails tf_dp={formattedSrc} altText={alt} useFallback={useFallback} />
        {order && onSuccess && <EditDpReceiptForm order={order} onSuccess={onSuccess} />}
      </div>
    );
  } else if (alt.includes("Settlement") || alt.includes("Pelunasan")) {
    return (
      <div className="flex items-center gap-1">
        <CaptureThumbnails tf_pelunasan={formattedSrc} altText={alt} useFallback={useFallback} />
        {order && onSuccess && <EditSettlementReceiptForm order={order} onSuccess={onSuccess} />}
      </div>
    );
  }
  
  // Fallback to old implementation for other cases
  return (
    <div 
      className="relative w-12 h-12 overflow-hidden rounded border cursor-pointer hover:opacity-80"
      onClick={onClick}
    >
      <Image 
        src={formattedSrc}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  )
}

// Receipt modal to show full-size image
const ReceiptModal = ({ 
  imageUrl, 
  isOpen, 
  onClose 
}: { 
  imageUrl: string | null, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  if (!isOpen || !imageUrl) return null
  
  // Ensure the imageUrl is properly formatted with a leading slash if it's a relative path
  const formattedImageUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/') 
    ? imageUrl 
    : `/${imageUrl}`
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>
        <div className="relative w-full h-[60vh]">
          <Image 
            src={formattedImageUrl} 
            alt="Payment receipt" 
            fill 
            className="object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Component to replace DP receipt
const EditDpReceiptForm = ({ order, onSuccess }: { order: OrderItem, onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast.error("Please upload a replacement receipt")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create form data for file upload
      const formUploadData = new FormData()
      formUploadData.append('file', file)
      
      // Upload file
      const uploadResp = await fetch('/api/upload?folder=tfuploads', {
        method: 'POST',
        body: formUploadData
      })
      
      if (!uploadResp.ok) {
        throw new Error('File upload failed')
      }
      
      const uploadData = await uploadResp.json()
      const uploadedFilePath = uploadData.path
      
      // Update order with new receipt path
      const updateResp = await fetch(`/api/orders/payment/update-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          receiptType: 'dp',
          receiptPath: uploadedFilePath
        })
      })
      
      if (!updateResp.ok) {
        const contentType = updateResp.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await updateResp.json()
          throw new Error(errorData.error || 'Failed to update receipt')
        } else {
          throw new Error(`Failed to update receipt: ${updateResp.status} ${updateResp.statusText}`)
        }
      }
      
      toast.success("Down payment receipt updated successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error updating receipt:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update receipt")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="p-1 h-7 w-7"
          disabled={!order.tf_dp}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4">
        <form onSubmit={handleSubmit}>
          <h3 className="font-medium text-lg mb-4">Replace DP Receipt</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="replace-dp-file">Upload New Receipt</Label>
              <Input
                id="replace-dp-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: JPG, PNG, JPEG (max 5MB)</p>
            </div>
            
            {file && (
              <div className="mt-2">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-muted-foreground">{file.name}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !file}
              >
                {isLoading ? "Uploading..." : "Update Receipt"}
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

// Component to replace Settlement receipt
const EditSettlementReceiptForm = ({ order, onSuccess }: { order: OrderItem, onSuccess: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      toast.error("Please upload a replacement receipt")
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create form data for file upload
      const formUploadData = new FormData()
      formUploadData.append('file', file)
      
      // Upload file
      const uploadResp = await fetch('/api/upload?folder=tfuploads', {
        method: 'POST',
        body: formUploadData
      })
      
      if (!uploadResp.ok) {
        throw new Error('File upload failed')
      }
      
      const uploadData = await uploadResp.json()
      const uploadedFilePath = uploadData.path
      
      // Update order with new receipt path
      const updateResp = await fetch(`/api/orders/payment/update-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          receiptType: 'settlement',
          receiptPath: uploadedFilePath
        })
      })
      
      if (!updateResp.ok) {
        const contentType = updateResp.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await updateResp.json()
          throw new Error(errorData.error || 'Failed to update receipt')
        } else {
          throw new Error(`Failed to update receipt: ${updateResp.status} ${updateResp.statusText}`)
        }
      }
      
      toast.success("Payment receipt updated successfully")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error updating receipt:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update receipt")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="p-1 h-7 w-7"
          disabled={!order.tf_pelunasan}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-4">
        <form onSubmit={handleSubmit}>
          <h3 className="font-medium text-lg mb-4">Replace Settlement Receipt</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="replace-settlement-file">Upload New Receipt</Label>
              <Input
                id="replace-settlement-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Accepted formats: JPG, PNG, JPEG (max 5MB)</p>
            </div>
            
            {file && (
              <div className="mt-2">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-muted-foreground">{file.name}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !file}
              >
                {isLoading ? "Uploading..." : "Update Receipt"}
              </Button>
            </div>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

export default function OrderPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [drafts, setDrafts] = useState<OrderItem[]>([])
  const [payments, setPayments] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDraftsLoading, setIsDraftsLoading] = useState(true)
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [draftsSearchQuery, setDraftsSearchQuery] = useState("")
  const [paymentsSearchQuery, setPaymentsSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("orders")
  
  // Receipt modal state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null)
  
  // Sorting state - Use created_at by default for reliable date sorting
  const [ordersSorting, setOrdersSorting] = useState<SortOption>({ field: "created_at", order: "desc" })
  const [draftsSorting, setDraftsSorting] = useState<SortOption>({ field: "created_at", order: "desc" })
  const [paymentsSorting, setPaymentsSorting] = useState<SortOption>({ field: "created_at", order: "desc" })
  
  // Modal state for SPK details
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  })
  const [draftsPagination, setDraftsPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  })
  const [paymentsPagination, setPaymentsPagination] = useState<Pagination>({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1
  })
  const [pageSize, setPageSize] = useState(10)
  const [draftsPageSize, setDraftsPageSize] = useState(10)
  const [paymentsPageSize, setPaymentsPageSize] = useState(10)
  
  // Fetch orders
  const fetchOrders = async (page = 1, pageSize = 10, searchTerm = "", sorting: SortOption = ordersSorting) => {
    try {
      setIsLoading(true)
      // Exclude orders with PENDING status using server-side filtering
      let url = `/api/orders?page=${page}&pageSize=${pageSize}&sortField=${sorting.field}&sortOrder=${sorting.order}&exclude=PENDING`
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders")
      }
      
      const data = await response.json()
      
      // Orders will already exclude PENDING status from the server
      setOrders(data.orders || [])
      
      // Update pagination with the server-provided counts
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

  // Fetch drafts - now only shows orders with PENDING status
  const fetchDrafts = async (page = 1, pageSize = 10, searchTerm = "", sorting: SortOption = draftsSorting) => {
    try {
      setIsDraftsLoading(true)
      let url = `/api/orders?page=${page}&pageSize=${pageSize}&status=PENDING&sortField=${sorting.field}&sortOrder=${sorting.order}`
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch drafts")
      }
      
      const data = await response.json()
      
      setDrafts(data.orders || [])
      
      // Update pagination with the new structure
      setDraftsPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      })
      
    } catch (error) {
      console.error("Error fetching drafts:", error)
      toast.error("Failed to load drafts")
    } finally {
      setIsDraftsLoading(false)
    }
  }
  
  // Fetch payments
  const fetchPayments = async (
    page = 1,
    pageSize = 10,
    searchTerm = "",
    sorting: SortOption = paymentsSorting,
  ) => {
    try {
      setIsPaymentsLoading(true);
      // Get orders that need payment processing
      // Add keterangan filter for Settled tab
      let url = `/api/orders?page=${page}&pageSize=${pageSize}&sortField=${
        sorting.field
      }&sortOrder=${sorting.order}&exclude=PENDING`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      // Add filter for invoiced orders
      if (activeTab === "payments") {
        url += "&keterangan=SUDAH%20DIINVOICEKAN";
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch payment orders");
      }

      const data = await response.json();

      setPayments(data.orders || []);

      // Update pagination with the server-provided counts
      setPaymentsPagination({
        totalCount: data.totalCount || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
      });
    } catch (error) {
      console.error("Error fetching payment orders:", error);
      toast.error("Failed to load payment orders");
    } finally {
      setIsPaymentsLoading(false);
    }
  };
  
  // Reset to page 1 when search query changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, [searchQuery])
  
  useEffect(() => {
    setDraftsPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, [draftsSearchQuery])
  
  useEffect(() => {
    setPaymentsPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, [paymentsSearchQuery])
  
  // Fetch orders when pagination, pageSize, searchQuery, or sorting changes
  useEffect(() => {
    fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting)
  }, [pagination.currentPage, pageSize, searchQuery, ordersSorting])

  // Fetch drafts when drafts pagination, pageSize, searchQuery, or sorting changes
  useEffect(() => {
    fetchDrafts(draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting)
  }, [draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting])
  
  // Fetch payments when pagination, pageSize, searchQuery, or sorting changes
  useEffect(() => {
    fetchPayments(paymentsPagination.currentPage, paymentsPageSize, paymentsSearchQuery, paymentsSorting)
  }, [paymentsPagination.currentPage, paymentsPageSize, paymentsSearchQuery, paymentsSorting])
  
  // Initial fetch on component mount
  useEffect(() => {
    fetchOrders(1, pageSize)
    fetchDrafts(1, draftsPageSize)
    fetchPayments(1, paymentsPageSize)
  }, [])
  
  // Handle sorting changes for orders
  const handleOrdersSort = (field: string) => {
    setOrdersSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
  }
  
  // Handle sorting changes for drafts
  const handleDraftsSort = (field: string) => {
    setDraftsSorting(prev => ({
      field,
      order: prev.field === field && prev.order === "desc" ? "asc" : "desc"
    }))
  }
  
  // Handle sorting changes for payments
  const handlePaymentsSort = (field: string) => {
    setPaymentsSorting(prev => ({
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
  
  // Handle search input change for orders
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value) // Update the input field immediately for UI responsiveness
    debouncedSearch(value) // Debounce the actual API call
  }
  
  // Handle search input change for drafts
  const handleDraftsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDraftsSearchQuery(value) // Update the input field immediately for UI responsiveness
    debouncedSearch(value, true) // Debounce the actual API call
  }
  
  // Handle search input change for payments
  const handlePaymentsSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPaymentsSearchQuery(value) // Update the input field immediately for UI responsiveness
    debouncedSearch(value, false) // Debounce the actual API call
  }
  
  // Format date
  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      return format(new Date(dateValue), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Handle page change for orders
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    fetchOrders(newPage, pageSize, searchQuery, ordersSorting);
  }

  // Handle page change for drafts
  const handleDraftsPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > draftsPagination.totalPages) return;
    
    fetchDrafts(newPage, draftsPageSize, draftsSearchQuery, draftsSorting);
  }

  // Handle page change for payments
  const handlePaymentsPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > paymentsPagination.totalPages) return;
    
    fetchPayments(newPage, paymentsPageSize, paymentsSearchQuery, paymentsSorting);
  }
  
  // Handle page size change for orders
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    fetchOrders(1, newSize, searchQuery, ordersSorting);
  }

  // Handle page size change for drafts
  const handleDraftsPageSizeChange = (newSize: number) => {
    setDraftsPageSize(newSize);
    fetchDrafts(1, newSize, draftsSearchQuery, draftsSorting);
  }

  // Handle page size change for payments
  const handlePaymentsPageSizeChange = (newSize: number) => {
    setPaymentsPageSize(newSize);
    fetchPayments(1, newSize, paymentsSearchQuery, paymentsSorting);
  }
  
  // Handle view order
  const handleViewOrder = (order: OrderItem) => {
    router.push(`/order/view/${order.id}`)
  }
  
  // Handle edit order
  const handleEditOrder = (orderId: string, isDraft = false) => {
    if (isDraft) {
      router.push(`/order/pending/${orderId}`)
    } else {
      router.push(`/order/edit/${orderId}`)
    }
  }
  
  // Handle delete order
  const handleDeleteOrder = async (orderId: string, isDraft = false) => {
    if (confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
        })
        
        if (!response.ok) {
          throw new Error("Failed to delete order")
        }
        
        toast.success("Order deleted successfully")
        if (isDraft) {
          fetchDrafts(draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting)
        } else {
          fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting)
        }
      } catch (error) {
        console.error("Error deleting order:", error)
        toast.error("Failed to delete order")
      }
    }
  }

  // Handle click on SPK number
  const handleSpkClick = (order: OrderItem) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  // Handle hold order
  const handleHoldOrder = async (orderId: string, isDraft = false) => {
    // Show modal to get hold reason
    const reason = prompt("Please provide a reason for putting this order on hold:");
    
    if (!reason) {
      toast.error("A reason is required to put an order on hold");
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          holdReason: reason
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to put order on hold");
      }
      
      toast.success("Order successfully put on hold");
      
      // Refresh the appropriate list
      if (isDraft) {
        fetchDrafts(draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting);
      } else {
        fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting);
      }
    } catch (error) {
      console.error("Error holding order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to put order on hold");
    }
  }

  // Handle resume order
  const handleResumeOrder = async (orderId: string, isDraft = false) => {
    try {
      const response = await fetch(`/api/orders/resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to resume order");
      }
      
      toast.success("Order successfully resumed");
      
      // Refresh the appropriate list
      if (isDraft) {
        fetchDrafts(draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting);
      } else {
        fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting);
      }
    } catch (error) {
      console.error("Error resuming order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resume order");
    }
  }

  // Handle complete order
  const handleCompleteOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to mark this order as completed? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/orders/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to mark order as completed");
        }
        
        toast.success("Order marked as completed");
        fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting);
      } catch (error) {
        console.error("Error marking order as completed:", error);
        toast.error("Failed to mark order as completed");
      }
    }
  }

  // Handle deliver order
  const handleDeliverOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to mark this order as delivered? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/orders/deliver`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to mark order as delivered");
        }
        
        toast.success("Order marked as delivered");
        fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting);
      } catch (error) {
        console.error("Error marking order as delivered:", error);
        toast.error("Failed to mark order as delivered");
      }
    }
  }

  // Handle cancel order
  const handleCancelOrder = async (orderId: string) => {
    // Show modal to get cancellation reason
    const reason = prompt("Please provide a reason for cancelling this order:");
    
    if (!reason) {
      toast.error("A cancellation reason is required");
      return;
    }

    if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/orders/cancel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            cancellationReason: reason
          }),
        });
        
        if (!response.ok) {
          throw new Error("Failed to cancel order");
        }
        
        toast.success("Order marked as cancelled");
        fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting);
      } catch (error) {
        console.error("Error cancelling order:", error);
        toast.error("Failed to cancel order");
      }
    }
  }

  // Handle payment success
  const handlePaymentSuccess = () => {
    // Refetch all data after successful payment
    fetchOrders(pagination.currentPage, pageSize, searchQuery, ordersSorting)
    fetchDrafts(draftsPagination.currentPage, draftsPageSize, draftsSearchQuery, draftsSorting)
    fetchPayments(paymentsPagination.currentPage, paymentsPageSize, paymentsSearchQuery, paymentsSorting)
  }
  
  // Receipt modal handlers
  const handleOpenReceiptModal = (imageUrl: string | null | undefined) => {
    if (imageUrl) {
      setActiveReceiptUrl(imageUrl)
      setIsReceiptModalOpen(true)
    }
  }
  
  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false)
    setActiveReceiptUrl(null)
  }
  
  // Add ReceiptModal component to the JSX
  useEffect(() => {
    // ... existing code ...
  }, [activeReceiptUrl])

  return (
    <div className="container mx-auto space-y-4 h-full flex flex-col overflow-visible">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              if (activeTab === "orders") {
                fetchOrders(1, pageSize)
              } else {
                fetchDrafts(1, draftsPageSize)
              }
            }}
            className="bg-background/50 border-border/50 hover:bg-background/70"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            className="bg-primary/90 hover:bg-primary text-primary-foreground"
            onClick={() => router.push('/order/add')}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Add New Order
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="orders" onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="orders">Active Orders</TabsTrigger>
          <TabsTrigger value="drafts">Pending Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="space-y-4 mt-0">
          {/* Search for Orders */}
      <div className="py-4 bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders by SPK, project, customer, product..."
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
              }}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="bg-transparent flex-1 flex flex-col overflow-visible">
        <CardHeader className="bg-transparent pb-2">
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            Manage your customer orders and track their status.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent flex-1 flex flex-col overflow-visible">
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
                          <SortableTableHead field="no_project" sorting={ordersSorting} onSort={handleOrdersSort}>No Project</SortableTableHead>
                          <SortableTableHead field="spk" sorting={ordersSorting} onSort={handleOrdersSort}>SPK</SortableTableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                          <SortableTableHead field="produk" sorting={ordersSorting} onSort={handleOrdersSort}>Product</SortableTableHead>
                      <TableHead>Fabric Origins</TableHead>
                          <SortableTableHead field="status" sorting={ordersSorting} onSort={handleOrdersSort}>Status</SortableTableHead>
                          <SortableTableHead field="qty" sorting={ordersSorting} onSort={handleOrdersSort}>Qty</SortableTableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Capture</TableHead>
                          <SortableTableHead field="marketing" sorting={ordersSorting} onSort={handleOrdersSort}>Marketing</SortableTableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 text-center py-6 text-muted-foreground">
                          {searchQuery 
                            ? "No orders match your search criteria" 
                            : "No orders found. Add an order to get started!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                          <TableCell>{order.no_project || "N/A"}</TableCell>
                              <TableCell>
                                <span 
                                  className="text-primary hover:text-primary/80 cursor-pointer hover:underline"
                                  onClick={() => handleSpkClick(order)}
                                >
                                  {order.spk || "N/A"}
                                </span>
                              </TableCell>
                          <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                          <TableCell>
                            {order.customer?.telp 
                              ? `62${order.customer.telp.startsWith('8') ? order.customer.telp : order.customer.telp.replace(/^0+/, '')}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{order.produk || "N/A"}</TableCell>
                          <TableCell>{order.originCustomer?.nama || order.asal_bahan || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(order.status || order.statusm)}</TableCell>
                          <TableCell>{order.qty || "N/A"}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{order.catatan || "N/A"}</TableCell>
                          <TableCell>
                            <CaptureThumbnails
                              capture={order.capture}
                              captureName={order.capture_name}
                              altText={order.produk || "Design"}
                            />
                          </TableCell>
                          <TableCell>{order.marketingUser?.name || order.marketingInfo?.name || order.marketing || "N/A"}</TableCell>
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
                                  onClick={() => handleHoldOrder(order.id)}
                                  disabled={["ON_HOLD", "CANCELLED", "COMPLETED", "DELIVERED"].includes(order.status || "")}
                                >
                                  <PauseCircle className="mr-2 h-4 w-4" /> Hold
                                </DropdownMenuItem>
                                {order.status === "ON_HOLD" && (
                                  <DropdownMenuItem onClick={() => handleResumeOrder(order.id)}>
                                    <PlayCircle className="mr-2 h-4 w-4" /> Resume
                                  </DropdownMenuItem>
                                )}
                                {["APPROVED", "PROSES"].includes(order.status || "") && (
                                  <DropdownMenuItem onClick={() => handleCompleteOrder(order.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Complete
                                  </DropdownMenuItem>
                                )}
                                {order.status === "COMPLETED" && (
                                  <DropdownMenuItem onClick={() => handleDeliverOrder(order.id)}>
                                    <Truck className="mr-2 h-4 w-4" /> Deliver
                                  </DropdownMenuItem>
                                )}
                                {!["CANCELLED", "COMPLETED", "DELIVERED"].includes(order.status || "") && (
                                  <DropdownMenuItem onClick={() => handleCancelOrder(order.id)}>
                                    <XCircle className="mr-2 h-4 w-4" /> Cancel
                                  </DropdownMenuItem>
                                )}
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
              
                  {/* Pagination Controls for Orders */}
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{orders.length}</span> of{" "}
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
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4 mt-0">
          {/* Search for Drafts */}
          <div className="py-4 bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
            <div className="container px-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search pending orders by SPK, project, customer, product..."
                    className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                    value={draftsSearchQuery}
                    onChange={handleDraftsSearchChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto bg-background/50 border-border/50 hover:bg-background/70"
                  onClick={() => {
                    setDraftsSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          
          <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 flex-1 flex flex-col overflow-visible">
            <CardHeader className="pb-2">
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>
                Manage orders waiting for processing or approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-visible">
              {isDraftsLoading ? (
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
                          <SortableTableHead field="created_at" sorting={draftsSorting} onSort={handleDraftsSort}>Date</SortableTableHead>
                          <SortableTableHead field="no_project" sorting={draftsSorting} onSort={handleDraftsSort}>No Project</SortableTableHead>
                          <SortableTableHead field="spk" sorting={draftsSorting} onSort={handleDraftsSort}>SPK</SortableTableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Phone</TableHead>
                          <SortableTableHead field="produk" sorting={draftsSorting} onSort={handleDraftsSort}>Product</SortableTableHead>
                          <TableHead>Fabric Origins</TableHead>
                          <TableHead>Status</TableHead>
                          <SortableTableHead field="qty" sorting={draftsSorting} onSort={handleDraftsSort}>Qty</SortableTableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Capture</TableHead>
                          <SortableTableHead field="marketing" sorting={draftsSorting} onSort={handleDraftsSort}>Marketing</SortableTableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drafts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                              {draftsSearchQuery 
                                ? "No drafts match your search criteria" 
                                : "No draft orders found. Draft functionality is in development."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          drafts.map((order) => (
                            <TableRow key={order.id} className="hover:bg-muted/50">
                              <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                              <TableCell>{order.no_project || "N/A"}</TableCell>
                              <TableCell>
                                <span 
                                  className="text-primary hover:text-primary/80 cursor-pointer hover:underline"
                                  onClick={() => handleSpkClick(order)}
                                >
                                  {order.spk || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                              <TableCell>
                                {order.customer?.telp 
                                  ? `62${order.customer.telp.startsWith('8') ? order.customer.telp : order.customer.telp.replace(/^0+/, '')}`
                                  : "N/A"}
                              </TableCell>
                              <TableCell>{order.produk || "N/A"}</TableCell>
                              <TableCell>{order.originCustomer?.nama || order.asal_bahan || "N/A"}</TableCell>
                              <TableCell>{getStatusBadge(order.status || order.statusm)}</TableCell>
                              <TableCell>{order.qty || "N/A"}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{order.catatan || "N/A"}</TableCell>
                              <TableCell>
                                <CaptureThumbnails
                                  capture={order.capture}
                                  captureName={order.capture_name}
                                  altText={order.produk || "Design"}
                                />
                              </TableCell>
                              <TableCell>{order.marketingUser?.name || order.marketingInfo?.name || order.marketing || "N/A"}</TableCell>
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
                                    <DropdownMenuItem onClick={() => handleEditOrder(order.id, true)}>
                                      <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleHoldOrder(order.id, true)}
                                      disabled={["ON_HOLD", "CANCELLED", "COMPLETED", "DELIVERED"].includes(order.status || "")}
                                    >
                                      <PauseCircle className="mr-2 h-4 w-4" /> Hold
                                    </DropdownMenuItem>
                                    {order.status === "ON_HOLD" && (
                                      <DropdownMenuItem onClick={() => handleResumeOrder(order.id, true)}>
                                        <PlayCircle className="mr-2 h-4 w-4" /> Resume
                                      </DropdownMenuItem>
                                    )}
                                    {["APPROVED", "PROSES"].includes(order.status || "") && (
                                      <DropdownMenuItem onClick={() => handleCompleteOrder(order.id)}>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Complete
                                      </DropdownMenuItem>
                                    )}
                                    {order.status === "COMPLETED" && (
                                      <DropdownMenuItem onClick={() => handleDeliverOrder(order.id)}>
                                        <Truck className="mr-2 h-4 w-4" /> Deliver
                                      </DropdownMenuItem>
                                    )}
                                    {!["CANCELLED", "COMPLETED", "DELIVERED"].includes(order.status || "") && (
                                      <DropdownMenuItem onClick={() => handleCancelOrder(order.id)}>
                                        <XCircle className="mr-2 h-4 w-4" /> Cancel
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => handleDeleteOrder(order.id, true)}
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
                  
                  {/* Pagination Controls for Drafts */}
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{drafts.length}</span> of{" "}
                        <span className="font-medium">{draftsPagination.totalCount}</span> drafts
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDraftsPageChange(1)}
                        disabled={draftsPagination.currentPage === 1 || isDraftsLoading}
                      >
                        <span className="sr-only">First page</span>
                        <ChevronLeft className="h-4 w-4" />
                        <ChevronLeft className="h-4 w-4 -ml-2" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDraftsPageChange(draftsPagination.currentPage - 1)}
                        disabled={draftsPagination.currentPage === 1 || isDraftsLoading}
                      >
                        <span className="sr-only">Previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      <span className="text-sm font-medium">
                        Page {draftsPagination.currentPage} of {draftsPagination.totalPages || 1}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDraftsPageChange(draftsPagination.currentPage + 1)}
                        disabled={draftsPagination.currentPage >= draftsPagination.totalPages || isDraftsLoading}
                      >
                        <span className="sr-only">Next page</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDraftsPageChange(draftsPagination.totalPages)}
                        disabled={draftsPagination.currentPage >= draftsPagination.totalPages || isDraftsLoading}
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

        <TabsContent value="payments" className="space-y-4 mt-0">
          {/* Payment Status Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 grid grid-cols-2 w-full md:w-[400px] mb-4">
              <TabsTrigger value="all">All Payments</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            </TabsList>

          {/* Search for Payments */}
          <div className="py-4 bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6">
            <div className="container px-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payment orders by SPK, project, customer, product..."
                    className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary/70"
                    value={paymentsSearchQuery}
                    onChange={handlePaymentsSearchChange}
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto bg-transparent border-border/50 hover:bg-background/70"
                  onClick={() => {
                    setPaymentsSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>
          
          
            <TabsContent value="all">
              <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 flex-1 flex flex-col overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle>All Orders Payment Status</CardTitle>
                  <CardDescription>
                    View all orders requiring payment processing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-visible">
                  {isPaymentsLoading ? (
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
                              <SortableTableHead field="created_at" sorting={paymentsSorting} onSort={handlePaymentsSort}>Date</SortableTableHead>
                              <SortableTableHead field="no_project" sorting={paymentsSorting} onSort={handlePaymentsSort}>No Project</SortableTableHead>
                              <SortableTableHead field="spk" sorting={paymentsSorting} onSort={handlePaymentsSort}>SPK</SortableTableHead>
                              <TableHead>Customer</TableHead>
                              <SortableTableHead field="produk" sorting={paymentsSorting} onSort={handlePaymentsSort}>Product</SortableTableHead>
                              <TableHead>Status</TableHead>
                              <SortableTableHead field="nominal" sorting={paymentsSorting} onSort={handlePaymentsSort}>Total</SortableTableHead>
                              <SortableTableHead field="dp" sorting={paymentsSorting} onSort={handlePaymentsSort}>Down Payment</SortableTableHead>
                              <SortableTableHead field="sisa" sorting={paymentsSorting} onSort={handlePaymentsSort}>Remaining</SortableTableHead>
                              <TableHead>Payment Status</TableHead>
                              <TableHead>Receipts</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                                  {paymentsSearchQuery 
                                    ? "No payment orders match your search criteria" 
                                    : "No payment orders found"}
                                </TableCell>
                              </TableRow>
                            ) : (
                              payments.map((order) => (
                                <TableRow key={order.id} className="hover:bg-muted/50">
                                  <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                                  <TableCell>{order.no_project || "N/A"}</TableCell>
                                  <TableCell>
                                    <span 
                                      className="text-primary hover:text-primary/80 cursor-pointer hover:underline"
                                      onClick={() => handleSpkClick(order)}
                                    >
                                      {order.spk || "N/A"}
                                    </span>
                                  </TableCell>
                                  <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                                  <TableCell>{order.produk || "N/A"}</TableCell>
                                  <TableCell>{getStatusBadge(order.status || order.statusm)}</TableCell>
                                  <TableCell>{formatCurrency(order.nominal || 0)}</TableCell>
                                  <TableCell>{formatCurrency(order.dp || 0)}</TableCell>
                                  <TableCell>{formatCurrency(order.sisa || 0)}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        order.biaya_tambahan === "LUNAS" ? "default" :
                                        order.biaya_tambahan === "DP" ? "secondary" :
                                        order.biaya_tambahan === "NO DP" ? "outline" :
                                        "outline"
                                      }
                                    >
                                      {order.biaya_tambahan === "LUNAS" ? "Paid" :
                                       order.biaya_tambahan === "DP" ? "Down Payment" :
                                       order.biaya_tambahan === "NO DP" ? "No DP Required" :
                                       "Unpaid"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-1">
                                      <ImageThumbnail
                                        src={order.tf_dp}
                                        alt="DP Receipt"
                                        onClick={() => handleOpenReceiptModal(order.tf_dp)}
                                        order={order}
                                        onSuccess={handlePaymentSuccess}
                                      />
                                      <ImageThumbnail
                                        src={order.tf_pelunasan}
                                        alt="Settlement Receipt"
                                        onClick={() => handleOpenReceiptModal(order.tf_pelunasan)}
                                        order={order}
                                        onSuccess={handlePaymentSuccess}
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      {order.dp && order.dp > 0 && (
                                        <EditDpReceiptForm 
                                          order={order} 
                                          onSuccess={handlePaymentSuccess} 
                                        />
                                      )}
                                      {order.tgl_lunas && (
                                        <EditSettlementReceiptForm 
                                          order={order} 
                                          onSuccess={handlePaymentSuccess} 
                                        />
                                      )}
                                    </div>
                                  </TableCell>                                 
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Pagination Controls for Payments */}
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{payments.length}</span> of{" "}
                            <span className="font-medium">{paymentsPagination.totalCount}</span> orders
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePaymentsPageChange(1)}
                            disabled={paymentsPagination.currentPage === 1 || isPaymentsLoading}
                          >
                            <span className="sr-only">First page</span>
                            <ChevronLeft className="h-4 w-4" />
                            <ChevronLeft className="h-4 w-4 -ml-2" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePaymentsPageChange(paymentsPagination.currentPage - 1)}
                            disabled={paymentsPagination.currentPage === 1 || isPaymentsLoading}
                          >
                            <span className="sr-only">Previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          <span className="text-sm font-medium">
                            Page {paymentsPagination.currentPage} of {paymentsPagination.totalPages || 1}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePaymentsPageChange(paymentsPagination.currentPage + 1)}
                            disabled={paymentsPagination.currentPage >= paymentsPagination.totalPages || isPaymentsLoading}
                          >
                            <span className="sr-only">Next page</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handlePaymentsPageChange(paymentsPagination.totalPages)}
                            disabled={paymentsPagination.currentPage >= paymentsPagination.totalPages || isPaymentsLoading}
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

            <TabsContent value="unpaid">
              <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 flex-1 flex flex-col overflow-visible">
                <CardHeader className="pb-2">
                  <CardTitle>Unpaid Orders</CardTitle>
                  <CardDescription>
                    Orders that need payment processing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-visible">
                  {isPaymentsLoading ? (
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
                              <SortableTableHead field="created_at" sorting={paymentsSorting} onSort={handlePaymentsSort}>Date</SortableTableHead>
                              <SortableTableHead field="no_project" sorting={paymentsSorting} onSort={handlePaymentsSort}>No Project</SortableTableHead>
                              <SortableTableHead field="spk" sorting={paymentsSorting} onSort={handlePaymentsSort}>SPK</SortableTableHead>
                              <TableHead>Customer</TableHead>
                              <SortableTableHead field="produk" sorting={paymentsSorting} onSort={handlePaymentsSort}>Product</SortableTableHead>
                              <TableHead>Status</TableHead>
                              <SortableTableHead field="nominal" sorting={paymentsSorting} onSort={handlePaymentsSort}>Total</SortableTableHead>
                              <TableHead>Receipts</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.filter(order => 
                              // Unpaid orders: orders where 'sisa' value is not "0" including [null]
                              order.sisa !== 0 || order.sisa === null
                            ).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                                  {paymentsSearchQuery 
                                    ? "No unpaid orders match your search criteria" 
                                    : "No unpaid orders found"}
                                </TableCell>
                              </TableRow>
                            ) : (
                              payments
                                .filter(order => 
                                  // Unpaid orders: orders where 'sisa' value is not "0" including [null]
                                  order.sisa !== 0 || order.sisa === null
                                )
                                .map((order) => (
                                  <TableRow key={order.id} className="hover:bg-muted/50">
                                    <TableCell>{formatDate(order.created_at || order.tanggal)}</TableCell>
                                    <TableCell>{order.no_project || "N/A"}</TableCell>
                                    <TableCell>
                                      <span 
                                        className="text-primary hover:text-primary/80 cursor-pointer hover:underline"
                                        onClick={() => handleSpkClick(order)}
                                      >
                                        {order.spk || "N/A"}
                                      </span>
                                    </TableCell>
                                    <TableCell>{order.customer?.nama || "N/A"}</TableCell>
                                    <TableCell>{order.produk || "N/A"}</TableCell>
                                    <TableCell>{getStatusBadge(order.status || order.statusm)}</TableCell>
                                    <TableCell>{formatCurrency(order.nominal || 0)}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-1">
                                        <ImageThumbnail
                                          src={order.tf_dp}
                                          alt="DP Receipt"
                                          onClick={() => handleOpenReceiptModal(order.tf_dp)}
                                          order={order}
                                          onSuccess={handlePaymentSuccess}
                                        />
                                        <ImageThumbnail
                                          src={order.tf_pelunasan}
                                          alt="Settlement Receipt"
                                          onClick={() => handleOpenReceiptModal(order.tf_pelunasan)}
                                          order={order}
                                          onSuccess={handlePaymentSuccess}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <NoDpForm
                                          order={order}
                                          onSuccess={handlePaymentSuccess}
                                        />
                                        <DpPaymentForm
                                          order={order}
                                          onSuccess={handlePaymentSuccess}
                                        />
                                        <SettlePaymentForm
                                          order={order}
                                          onSuccess={handlePaymentSuccess}
                                        />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      
      {/* Order SPK Modal */}
      <OrderSpkModal 
        order={selectedOrder} 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
      
      {/* Receipt Modal */}
      <ReceiptModal 
        imageUrl={activeReceiptUrl} 
        isOpen={isReceiptModalOpen} 
        onClose={handleCloseReceiptModal} 
      />
    </div>
  )
}