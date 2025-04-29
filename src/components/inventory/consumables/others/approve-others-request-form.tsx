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

interface ApproveOthersRequestFormProps {
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

export function ApproveOthersRequestForm({
  open,
  onOpenChange,
  requestId,
  onSuccess,
  requestDetails
}: ApproveOthersRequestFormProps) {
  const [approverNotes, setApproverNotes] = useState("")
  const [isApproving, setIsApproving] = useState(false)

  // Handle request approval
  const handleApprove = async () => {
    if (!requestId) return
    
    setIsApproving(true)
    
    try {
      const response = await fetch('/api/inventory/others-request/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          approver_notes: approverNotes,
          update_quantity: true // Add flag to indicate we want to update quantity
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve request')
      }
      
      toast.success("Request approved successfully")
      setApproverNotes("")
      onOpenChange(false)
      if (typeof onSuccess === 'function') {
        onSuccess()
      }
    } catch (error) {
      console.error("Error approving request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to approve request")
    } finally {
      setIsApproving(false)
    }
  }

  // Reset the form when it's closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setApproverNotes("")
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
            <h2 className="text-lg font-semibold">Approve Request</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve this request
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
            <Label htmlFor="approverNotes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <Textarea
              id="approverNotes"
              placeholder="Add any notes about this approval"
              value={approverNotes}
              onChange={(e) => setApproverNotes(e.target.value)}
              className="min-h-[120px] resize-none bg-background/50"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isApproving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Request"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 