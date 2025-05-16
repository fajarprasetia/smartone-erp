"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw, PlusCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Request form component
import { RequestOthersForm } from "../print/request-others-form"

interface OthersRequest {
  id: string
  user_id: string
  requester_name?: string
  category: string
  item_name: string
  quantity: number
  unit?: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  user_notes?: string
  admin_notes?: string
  created_at: string
  updated_at: string
}

export function DTFStocksOthersTab() {
  const [othersRequests, setOthersRequests] = useState<OthersRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL")

  // Fetch requests data from API
  const fetchOthersRequests = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      // Build URL with query parameters for filters
      let url = '/api/inventory/others-request'
      const params = new URLSearchParams()
      
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }
      
      if (categoryFilter !== "ALL") {
        params.append("category", categoryFilter)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Map API data to component state format
      const formattedRequests = data.requests.map((req: any) => ({
        id: req.id,
        user_id: req.user_id,
        requester_name: req.user?.name || 'Unknown User',
        category: req.category,
        item_name: req.item_name,
        quantity: req.quantity,
        unit: req.unit,
        status: req.status,
        user_notes: req.user_notes,
        admin_notes: req.approver_notes || req.rejection_reason,
        created_at: req.created_at,
        updated_at: req.updated_at
      }))
      
      setOthersRequests(formattedRequests)
    } catch (error) {
      console.error("Error fetching others requests:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load others requests"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts or when filters change
  useEffect(() => {
    fetchOthersRequests()
  }, [statusFilter, categoryFilter])

  // Handle request form submission
  const onRequestSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/others-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit request')
      }
      
      toast.success("Request submitted successfully")
      setIsRequestDialogOpen(false)
      
      // Refresh requests after submitting
      fetchOthersRequests()
      
      return Promise.resolve()
    } catch (error) {
      console.error("Error submitting request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit request")
      return Promise.reject(error)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Filter requests by search query, status and category
  const filteredRequests = othersRequests.filter(request => {
    // Status filter
    if (statusFilter !== "ALL" && request.status !== statusFilter) {
      return false;
    }
    
    // Category filter
    if (categoryFilter !== "ALL" && request.category !== categoryFilter.toLowerCase()) {
      return false;
    }
    
    // Search filter
    return (
      (request.item_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.user_notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.requester_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">DTF Other Items Requests</h3>
        <div className="flex items-center space-x-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="SPAREPARTS">Spare Parts</SelectItem>
              <SelectItem value="STATIONERY">Stationery</SelectItem>
              <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={fetchOthersRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsRequestDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Item
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge variant="outline" className={
                      request.status === "APPROVED" 
                        ? "bg-green-50 text-green-700 border-green-200"
                        : request.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.requester_name || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.item_name}</TableCell>
                  <TableCell>{request.quantity} {request.unit}</TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.user_notes || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Request form modal */}
      <RequestOthersForm
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSubmit={onRequestSubmit}
      />
    </div>
  )
} 