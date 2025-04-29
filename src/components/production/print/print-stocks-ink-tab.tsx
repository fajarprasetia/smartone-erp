"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Search, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "sonner"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RequestInkForm } from "@/components/production/print/request-ink-form"
import { InkRequest } from "@/types/inventory"

// Form schema for ink request
interface RequestInkFormValues {
  ink_type: string
  color: string
  quantity: string
  unit: string
  user_notes?: string
}

export function PrintStocksInkTab() {
  const [inkRequests, setInkRequests] = useState<InkRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Fetch ink requests
  const fetchInkRequests = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      const response = await fetch('/api/inventory/ink-request?status=PENDING,APPROVED&include=ink_stock,requester')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || `Error: ${response.status}`
        console.error("API error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setInkRequests(data)
    } catch (error) {
      console.error("Error fetching ink requests:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load ink requests"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    fetchInkRequests()
  }, [])

  // Handle request ink form submission
  const onRequestInkSubmit = async (data: RequestInkFormValues) => {
    try {
      const response = await fetch('/api/inventory/ink-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || responseData.details || `Error: ${response.status}`)
      }
      
      toast.success("Ink request submitted successfully")
      setIsRequestDialogOpen(false)
      
      // Refresh ink requests after submitting request
      fetchInkRequests()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Error submitting ink request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit ink request")
      return Promise.reject(error)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Filter requests by search query and status
  const filteredRequests = inkRequests.filter(request => {
    // Status filter
    if (statusFilter !== "ALL" && request.status !== statusFilter) {
      return false
    }
    
    // Search filter
    return (
      (request.ink_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.color?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.unit?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.user_notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.requester_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })

  // Handle cancel request
  const handleCancelRequest = async (requestId: string) => {
    try {
      // This only deletes the request from ink_requests table without affecting ink_stocks
      const response = await fetch(`/api/inventory/ink-request/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || responseData.details || `Error: ${response.status}`);
      }
      
      toast.success("Ink request cancelled successfully");
      fetchInkRequests(); // Refresh the list
    } catch (error) {
      console.error("Error cancelling ink request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel ink request");
    }
  };
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-red-500 font-medium">{isError}</p>
        <Button onClick={fetchInkRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search ink requests..."
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
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchInkRequests} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsRequestDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Request Ink
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Ink Type</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>User Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span>Loading ink requests...</span>
                    </div>
                  ) : (
                    <>
                      No ink requests found.
                      <br />
                      <span className="text-sm">
                        Create a new request using the "Request Ink" button.
                      </span>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.status === "PENDING" ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    ) : request.status === "APPROVED" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Approved
                      </Badge>
                    ) : request.status === "REJECTED" ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {request.status || "Unknown"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{request.requester_name || "N/A"}</TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell>{request.ink_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-0 bg-opacity-10" style={{ 
                      backgroundColor: `${getColorHex(request.color.toLowerCase())}20`,
                      color: getColorHex(request.color.toLowerCase())
                    }}>
                      {request.color}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.quantity} {request.unit}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.user_notes || "N/A"}</TableCell>
                  <TableCell>
                    {request.status !== "APPROVED" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" 
                        onClick={() => handleCancelRequest(request.id)}
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
      
      {/* Request Ink Form */}
      <RequestInkForm
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={onRequestInkSubmit}
      />
    </div>
  )
}

// Helper function to convert color names to hex codes
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'yellow': '#FFFF00',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'light cyan': '#E0FFFF',
    'light magenta': '#FF77FF',
    'orange': '#FFA500',
    'purple': '#800080',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'pink': '#FFC0CB',
  }
  
  return colorMap[colorName] || '#666666' // Default color if not found
} 