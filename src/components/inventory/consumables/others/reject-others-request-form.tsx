"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RejectOthersRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  onSuccess: () => void
  requestDetails?: {
    item_name: string;
    quantity: number;
    category: string;
  } | null;
}

export function RejectOthersRequestForm({
  open,
  onOpenChange,
  requestId,
  onSuccess,
  requestDetails
}: RejectOthersRequestFormProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  // Handle request rejection
  const handleReject = async () => {
    if (!requestId) return
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    
    setIsRejecting(true)
    
    try {
      const response = await fetch('/api/inventory/others-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          rejection_reason: rejectionReason
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject request')
      }
      
      toast.success("Request rejected successfully")
      setRejectionReason("")
      onOpenChange(false)
      if (typeof onSuccess === 'function') {
        onSuccess()
      }
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reject request")
    } finally {
      setIsRejecting(false)
    }
  }

  // Reset the form when it's closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRejectionReason("")
    }
    onOpenChange(open)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-semibold">Reject Request</h2>
            <p className="text-sm text-muted-foreground">
              Provide a reason for rejecting this request
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {requestDetails && (
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="text-sm font-medium mb-2">Request Details</h3>
              <div className="grid grid-cols-2 gap-3 mt-1 text-sm">
                <div className="p-2 bg-background/50 rounded border border-border/50">
                  <span className="text-xs text-muted-foreground">Item</span>
                  <p className="font-medium truncate">{requestDetails.item_name}</p>
                </div>
                <div className="p-2 bg-background/50 rounded border border-border/50">
                  <span className="text-xs text-muted-foreground">Quantity</span>
                  <p className="font-medium">{requestDetails.quantity}</p>
                </div>
                <div className="p-2 bg-background/50 rounded border border-border/50">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <p className="font-medium capitalize">{requestDetails.category}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="rejectionReason" className="text-sm font-medium">
              Reason for Rejection <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Please provide a reason for rejecting this request"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px] resize-none bg-background/50"
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 