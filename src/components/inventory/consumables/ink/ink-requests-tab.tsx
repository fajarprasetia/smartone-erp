"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, Search } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { ApproveInkRequestForm } from "./approve-ink-request-form"

interface InkRequest {
  id: string
  ink_stock_id?: string
  requested_by: string
  requester_name?: string
  ink_type: string
  color: string
  quantity: string
  unit: string
  user_notes?: string
  created_at: string
  approved: boolean
  approved_by_id?: string
  approved_date?: string
  rejected: boolean
  rejected_by_id?: string
  rejected_date?: string
  rejection_reason?: string
  status?: string
  requested_by_user?: {
    id: string
    name: string
  }
  updated_at?: string
}

export function InkRequestsTab() {
  const [inkRequests, setInkRequests] = useState<InkRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("PENDING")
  
  // Rejection dialog state
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  
  // Approval dialog state
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<InkRequest | null>(null)

  // Fetch ink requests
  const fetchInkRequests = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      const response = await fetch('/api/inventory/ink-request?include=requester')
      
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

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get color hex for displaying colored badges
  const getColorHex = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      black: "#000000",
      white: "#FFFFFF",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
      yellow: "#FFFF00",
      red: "#FF0000",
      green: "#00FF00",
      blue: "#0000FF",
      orange: "#FFA500",
      purple: "#800080",
      brown: "#A52A2A",
      gray: "#808080",
      pink: "#FFC0CB",
    }
    
    return colorMap[color.toLowerCase()] || "#808080"
  }

  // Filter requests by search query and status
  const filteredRequests = inkRequests.filter(request => {
    // Status filter
    if (statusFilter !== "ALL") {
      if (request.status) {
        // If status field exists, use it directly
        if (request.status !== statusFilter) {
          return false;
        }
      } else {
        // Legacy fallback if status field is missing
        if (statusFilter === "PENDING" && (request.approved || request.rejected)) {
          return false;
        }
        if (statusFilter === "APPROVED" && !request.approved) {
          return false;
        }
        if (statusFilter === "REJECTED" && !request.rejected) {
          return false;
        }
      }
    }
    
    // Search filter
    return (
      (request.ink_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.color?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.unit?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.user_notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.requester_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (request.requested_by_user?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })

  // Open approval dialog
  const openApproveDialog = (request: InkRequest) => {
    setSelectedRequest(request)
    setIsApproveDialogOpen(true)
  }

  // Handle request approval with barcode
  const handleApprovalSubmit = async (requestId: string, data: { barcode_id: string }) => {
    try {
      const response = await fetch('/api/inventory/ink-request/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          request_id: requestId,
          barcode_id: data.barcode_id 
        }),
      })
      
      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || responseData.message || `Error: ${response.status}`)
      }
      
      toast.success("Ink request approved successfully")
      fetchInkRequests() // Refresh the list
      return Promise.resolve()
    } catch (error) {
      console.error("Error approving ink request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to approve ink request")
      return Promise.reject(error)
    }
  }

  // Handle request approval - deprecated, use openApproveDialog instead
  const handleApproveRequest = async (requestId: string) => {
    try {
      const request = inkRequests.find(req => req.id === requestId)
      if (request) {
        openApproveDialog(request)
      } else {
        throw new Error("Request not found")
      }
    } catch (error) {
      console.error("Error preparing approval:", error)
      toast.error(error instanceof Error ? error.message : "Failed to prepare approval")
    }
  }

  // Open rejection dialog
  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId)
    setRejectionReason("")
    setIsRejectDialogOpen(true)
  }

  // Handle request rejection
  const handleRejectRequest = async () => {
    if (!selectedRequestId) return
    
    try {
      const response = await fetch('/api/inventory/ink-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          request_id: selectedRequestId,
          rejection_reason: rejectionReason
        }),
      })
      
      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || responseData.message || `Error: ${response.status}`)
      }
      
      toast.success("Ink request rejected")
      setIsRejectDialogOpen(false)
      fetchInkRequests() // Refresh the list
    } catch (error) {
      console.error("Error rejecting ink request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reject ink request")
    }
  }
  
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
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Ink Type</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Action Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span>Loading ink requests...</span>
                    </div>
                  ) : (
                    <>
                      No ink requests found.
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.status ? (
                      <Badge variant="outline" className={
                        request.status === "APPROVED" 
                          ? "bg-green-50 text-green-700 border-green-200"
                          : request.status === "REJECTED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {request.status}
                      </Badge>
                    ) : request.approved ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Approved
                      </Badge>
                    ) : request.rejected ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Rejected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{request.requester_name || (request.requested_by_user?.name) || "N/A"}</TableCell>
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
                  <TableCell className="max-w-xs truncate">
                    {request.user_notes || "N/A"}
                    {request.rejected && request.rejection_reason && (
                      <div className="text-red-500 text-xs mt-1">
                        Reason: {request.rejection_reason}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {request.updated_at ? formatDate(request.updated_at) : 
                     request.approved ? formatDate(request.approved_date) : 
                     request.rejected ? formatDate(request.rejected_date) : 
                     "N/A"}
                  </TableCell>
                  <TableCell>
                    {(!request.status || request.status !== "APPROVED") && !request.approved && !request.rejected && (
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-xs"
                          onClick={() => openApproveDialog(request)}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => openRejectDialog(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Rejection Alert Dialog */}
      <AlertDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Ink Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this ink request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Provide a reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-24"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectRequest}
              className="bg-red-500 hover:bg-red-600"
            >
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approval Form with Barcode Scanner */}
      <ApproveInkRequestForm
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        inkRequest={selectedRequest}
        onSubmit={handleApprovalSubmit}
      />
    </div>
  )
} 