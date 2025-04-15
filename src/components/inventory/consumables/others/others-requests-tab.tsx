"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, PlusCircle, Check, X } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { ApproveOthersRequestForm } from "./approve-others-request-form"
import { RejectOthersRequestForm } from "./reject-others-request-form"

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
  approver_notes?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export function OthersRequestsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [requests, setRequests] = useState<OthersRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  
  // Approval dialog state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<OthersRequest | null>(null)
  
  // Rejection dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  
  // Fetch others requests
  const fetchRequests = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      // Build URL with query parameters for filters
      let url = '/api/inventory/others-request'
      const params = new URLSearchParams()
      
      if (statusFilter !== "ALL") {
        params.append("status", statusFilter)
      }
      
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter.toUpperCase())
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
        approver_notes: req.approver_notes,
        rejection_reason: req.rejection_reason,
        created_at: req.created_at,
        updated_at: req.updated_at
      }))
      
      setRequests(formattedRequests)
    } catch (error) {
      console.error("Error fetching others requests:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load requests"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load data when component mounts or when filters change
  useEffect(() => {
    fetchRequests()
  }, [statusFilter, categoryFilter])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Open approve dialog with selected request
  const openApproveDialog = (request: OthersRequest) => {
    setSelectedRequestId(request.id)
    setSelectedRequest(request)
    setIsApproveDialogOpen(true)
  }
  
  // Open reject dialog with selected request
  const openRejectDialog = (request: OthersRequest) => {
    setSelectedRequestId(request.id)
    setIsRejectDialogOpen(true)
  }
  
  // Filter requests by search query
  const filteredRequests = requests.filter(request => {
    return (
      (request.item_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.user_notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.requester_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Item Requests</CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-36">
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
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="spareparts">Spare Parts</SelectItem>
                <SelectItem value="stationery">Office Stationery</SelectItem>
                <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
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
            <Button variant="outline" onClick={fetchRequests}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Notes</TableHead>
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
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No requests found. {statusFilter === "ALL" ? "Create a new request using the sidebar." : `No ${statusFilter.toLowerCase()} requests.`}
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
                  <TableCell>{request.requester_name || "Unknown"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {request.category.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{request.item_name}</TableCell>
                  <TableCell>{request.quantity} {request.unit}</TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.user_notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {request.status === "PENDING" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() => openApproveDialog(request)}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => openRejectDialog(request)}
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {request.status !== "PENDING" && (
                        <span className="text-xs text-muted-foreground">
                          {request.status === "APPROVED" 
                            ? (request.approver_notes || "Approved")
                            : (request.rejection_reason || "Rejected")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Approve Dialog */}
      <ApproveOthersRequestForm
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        requestId={selectedRequestId || ""}
        onSuccess={fetchRequests}
        requestDetails={selectedRequest ? {
          item_name: selectedRequest.item_name,
          quantity: selectedRequest.quantity,
          category: selectedRequest.category
        } : null}
      />
      
      {/* Reject Dialog */}
      <RejectOthersRequestForm
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        requestId={selectedRequestId || ""}
        onSuccess={fetchRequests}
      />
    </Card>
  )
} 