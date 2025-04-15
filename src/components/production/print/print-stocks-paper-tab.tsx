"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

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
import { RequestPaperForm } from "@/components/production/print/request-paper-form"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Define interfaces
interface PaperStock {
  id: string
  barcode_id: string | null
  qrCode?: string | null
  supplier: string | null
  manufacturer?: string | null
  paper_type: string
  paperType: string
  type?: string
  gsm: string | number
  width: string | number
  height?: string | number
  length: string | number
  used: string | null
  waste: string | null
  remaining_length: string | number | null
  remainingLength?: string | number | null
  added_by: string
  addedByUserId?: string
  taken_by: string | null
  notes: string | null
  availability: "YES" | "NO"
  created_at: string
  dateAdded?: string
  updated_by: string
  user_name?: string
  paper_request_id?: string | null
  request_status?: "PENDING" | "APPROVED" | "REJECTED" | null
  approved?: boolean
  name?: string
  status?: "PENDING" | "APPROVED" | "REJECTED"
  user_notes?: string
  requested_at?: string
  requester_name?: string
  paper_stock?: {
    id: string
    remainingLength?: string | number | null
    remaining_length?: string | number | null
  }
}

// Form schema for paper request
const requestPaperSchema = z.object({
  barcode_id: z.string().optional(),
  paper_type: z.string().min(1, { message: "Paper type is required" }),
  gsm: z.string().min(1, { message: "GSM is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  user_notes: z.string().optional(),
})

type RequestPaperFormValues = z.infer<typeof requestPaperSchema>

export function PrintStocksPaperTab() {
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [availableGSMs, setAvailableGSMs] = useState<string[]>(["80", "100", "120"])
  const [availableWidths, setAvailableWidths] = useState<string[]>(["100", "120", "150"])
  const [availableLengths, setAvailableLengths] = useState<string[]>(["50", "75", "100"])
  const [selectedGSM, setSelectedGSM] = useState<string>("") 
  const [selectedWidth, setSelectedWidth] = useState<string>("")

  // Initialize request form
  const requestPaperForm = useForm<RequestPaperFormValues>({
    resolver: zodResolver(requestPaperSchema),
    defaultValues: {
      barcode_id: "",
      paper_type: "",
      gsm: "",
      width: "",
      length: "",
      user_notes: "",
    },
  })

  // Fetch paper stocks including pending and approved requests
  const fetchPaperStocks = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching paper requests...");
      // Fetch paper requests with PENDING and APPROVED status
      const response = await fetch('/api/inventory/paper-request?status=PENDING,APPROVED&include=paper_stock');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `Error: ${response.status}`;
        console.error("API error:", errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Paper requests received:", data);
      setPaperStocks(data);
    } catch (error) {
      console.error("Error fetching paper requests:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load paper requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchPaperStocks();
  }, []);

  // Handle GSM selection change in request form
  const handleGSMChange = (gsm: string) => {
    setSelectedGSM(gsm);
    requestPaperForm.setValue("gsm", gsm);
    
    // Simulate updating available widths based on selected GSM
    // In a real app, this would fetch from the API
    const widths = ["100", "120", "150"].filter(w => parseInt(w) >= parseInt(gsm) / 2);
    setAvailableWidths(widths);
    setSelectedWidth("");
    requestPaperForm.setValue("width", "");
    requestPaperForm.setValue("length", "");
    setAvailableLengths([]);
  };

  // Handle width selection change in request form
  const handleWidthChange = (width: string) => {
    setSelectedWidth(width);
    requestPaperForm.setValue("width", width);
    
    // Simulate updating available lengths based on selected GSM and width
    // In a real app, this would fetch from the API
    const lengths = ["50", "75", "100", "150", "200"].filter(l => parseInt(l) <= parseInt(width) * 2);
    setAvailableLengths(lengths);
    requestPaperForm.setValue("length", "");
  };

  // Handle request paper form submission
  const onRequestPaperSubmit = async (data: RequestPaperFormValues) => {
    try {
      const response = await fetch('/api/inventory/paper-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || responseData.details || `Error: ${response.status}`);
      }
      
      toast.success("Paper request submitted successfully");
      setIsRequestDialogOpen(false);
      
      // Refresh paper stocks after submitting request
      fetchPaperStocks();
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error submitting paper request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit paper request");
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

  // Get remaining length from paper stock if available
  const getRemainingLength = (stock: PaperStock) => {
    if (stock.paper_stock && stock.paper_stock.remainingLength) {
      return stock.paper_stock.remainingLength;
    }
    
    if (stock.remainingLength) {
      return stock.remainingLength;
    }
    
    if (stock.remaining_length) {
      return stock.remaining_length;
    }
    
    // For PENDING requests, display the requested length
    if (stock.status === "PENDING") {
      return stock.length;
    }
    
    return "N/A";
  };

  // Format the length value for display
  const formatLength = (length: string | number | null | undefined) => {
    if (length === null || length === undefined) return "N/A";
    return `${length} m`;
  };

  // Filter stocks by search query and status
  const filteredStocks = paperStocks.filter(stock => {
    // Status filter
    if (statusFilter !== "ALL" && stock.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    return (
      (stock.barcode_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.supplier?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.gsm?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.width?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.user_notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.requester_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.paper_type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  });

  // Add handle cancel function
  const handleCancelRequest = async (requestId: string) => {
    try {
      // This only deletes the request from paper_requests table without affecting paper_stocks
      const response = await fetch(`/api/inventory/paper-request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || responseData.details || `Error: ${response.status}`);
      }
      
      toast.success("Paper request cancelled successfully");
      fetchPaperStocks(); // Refresh the list
    } catch (error) {
      console.error("Error cancelling paper request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel paper request");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search paper requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Requests</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={() => setIsRequestDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" /> Request Paper
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Paper Type</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Remaining Length</TableHead>
              <TableHead>User Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span>Loading paper requests...</span>
                    </div>
                  ) : (
                    <>
                      No paper requests found.
                      <br />
                      <span className="text-sm">
                        Create a new request using the "Request Paper" button.
                      </span>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>
                    {stock.status === "PENDING" ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    ) : stock.status === "APPROVED" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {stock.status || "Unknown"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{stock.requester_name || stock.user_name || "N/A"}</TableCell>
                  <TableCell>{stock.requested_at ? formatDate(stock.requested_at) : "N/A"}</TableCell>
                  <TableCell>{stock.paperType || stock.paper_type}</TableCell>
                  <TableCell>{stock.gsm}</TableCell>
                  <TableCell>{stock.width}</TableCell>
                  <TableCell>{formatLength(stock.length)}</TableCell>
                  <TableCell>
                    {stock.status === "PENDING" ? (
                      <span className="text-muted-foreground italic">Pending</span>
                    ) : (
                      formatLength(getRemainingLength(stock))
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{stock.user_notes || stock.notes || "N/A"}</TableCell>
                  <TableCell>
                    {stock.status !== "APPROVED" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" 
                        onClick={() => handleCancelRequest(stock.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Request Paper Form */}
      <RequestPaperForm
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={onRequestPaperSubmit}
      />
    </div>
  )
} 