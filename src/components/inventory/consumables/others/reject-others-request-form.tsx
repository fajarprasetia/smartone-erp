"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
}

export function RejectOthersRequestForm({
  open,
  onOpenChange,
  requestId,
  onSuccess,
}: RejectOthersRequestFormProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState(false)

  // Handle request rejection
  const handleReject = async () => {
    if (!requestId || !rejectionReason.trim()) return
    
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
      onSuccess()
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this request.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rejectionReason" className="text-sm font-medium">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="rejectionReason"
              placeholder="Explain why this request is being rejected"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[150px] resize-none bg-background/50"
              required
            />
            {rejectionReason.trim() === "" && (
              <p className="text-sm text-red-500">Rejection reason is required</p>
            )}
          </div>
        </div>
        
        <DialogFooter className="pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isRejecting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReject}
            disabled={isRejecting || rejectionReason.trim() === ""}
            className="bg-red-600 hover:bg-red-700 text-white"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 