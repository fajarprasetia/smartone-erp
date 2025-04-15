"use client"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

import { ApprovePaperRequestForm } from "./approve-paper-request-form"
import { RejectPaperRequestForm } from "./reject-paper-request-form"

// Define the form value types used by our modal forms
type BarcodeInputFormValues = {
  barcode_id: string
}

type RejectFormValues = {
  rejection_reason?: string
}

// Define interfaces
interface PaperRequest {
  id: string
  requested_by: string
  paper_type: string
  gsm: string
  width: string
  length: string
  user_notes: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  approved_by: string | null
  rejected_by: string | null
  created_at: string
  updated_at: string
  user_name?: string
  approver_name?: string
  rejecter_name?: string
}

export function PaperRequestsTab() {
  const [paperRequests, setPaperRequests] = useState<PaperRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<PaperRequest | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)

  // Fetch paper requests
  const fetchPaperRequests = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/inventory/paper-request');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setPaperRequests(data);
    } catch (error) {
      console.error("Error fetching paper requests:", error);
      toast.error("Failed to load paper requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchPaperRequests();
  }, []);

  // Handle approve request
  const handleApproveRequest = async (request: PaperRequest) => {
    setSelectedRequest(request);
    setIsApproveDialogOpen(true);
  };
  
  // Handle approval form submission
  const handleApprovalSubmit = async (requestId: string, data: BarcodeInputFormValues) => {
    try {
      const response = await fetch(`/api/inventory/paper-request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'APPROVE',
          barcode_id: data.barcode_id,
        }),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || `Error: ${response.status}`);
      }
      
      toast.success(`Request approved successfully with barcode: ${data.barcode_id}`);
      setIsApproveDialogOpen(false);
      setSelectedRequest(null);
      fetchPaperRequests(); // Refresh the list
      return Promise.resolve();
    } catch (error) {
      console.error("Error approving request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to approve request");
      return Promise.reject(error);
    }
  };

  // Handle reject request
  const handleRejectRequest = async (request: PaperRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };

  // Handle confirm rejection
  const handleConfirmReject = async (requestId: string, data?: RejectFormValues) => {
    try {
      const response = await fetch(`/api/inventory/paper-request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'REJECT',
          rejection_reason: data?.rejection_reason
        }),
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || `Error: ${response.status}`);
      }
      
      toast.success("Request rejected successfully");
      setIsRejectDialogOpen(false);
      setSelectedRequest(null);
      fetchPaperRequests(); // Refresh the list
      return Promise.resolve();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reject request");
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Paper Requests</h3>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request by</TableHead>
              <TableHead>Paper Type</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>User Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : paperRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No paper requests found
                </TableCell>
              </TableRow>
            ) : (
              paperRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.user_name || "N/A"}</TableCell>
                  <TableCell>{request.paper_type}</TableCell>
                  <TableCell>{request.gsm}</TableCell>
                  <TableCell>{request.width}</TableCell>
                  <TableCell>{request.length}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.user_notes || "N/A"}</TableCell>
                  <TableCell>
                    {request.status === "PENDING" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        PENDING
                      </span>
                    ) : request.status === "APPROVED" ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        APPROVED
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        REJECTED
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(request.created_at)}</TableCell>
                  <TableCell>
                    {request.status === "PENDING" && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-red-600"
                          onClick={() => handleRejectRequest(request)}
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2 text-green-600"
                          onClick={() => handleApproveRequest(request)}
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve
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
      
      {/* Approval form */}
      <ApprovePaperRequestForm
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        paperRequest={selectedRequest}
        onSubmit={handleApprovalSubmit}
      />
      
      {/* Rejection form */}
      <RejectPaperRequestForm
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        paperRequest={selectedRequest}
        onSubmit={handleConfirmReject}
      />
    </div>
  )
} 