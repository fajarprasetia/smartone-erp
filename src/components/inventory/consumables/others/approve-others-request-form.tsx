"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
  const [itemDetails, setItemDetails] = useState<{id: string, currentQuantity: number} | null>(null)
  const [isLoadingItem, setIsLoadingItem] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the item details when the form opens
  useEffect(() => {
    if (open && requestDetails) {
      const fetchItemDetails = async () => {
        setIsLoadingItem(true)
        setError(null)
        
        try {
          // Fetch the current item quantity
          const response = await fetch(`/api/inventory/others-item?item_name=${encodeURIComponent(requestDetails.item_name)}&category=${encodeURIComponent(requestDetails.category)}&availability=YES`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch item details')
          }
          
          const data = await response.json()
          
          if (!data.items || data.items.length === 0) {
            throw new Error('Item not found or not available')
          }
          
          // Check if there's enough quantity
          const item = data.items[0]
          
          if (item.quantity < requestDetails.quantity) {
            setError(`Insufficient quantity. Available: ${item.quantity}, Requested: ${requestDetails.quantity}`)
          } else {
            setItemDetails({
              id: item.id,
              currentQuantity: item.quantity
            })
          }
        } catch (error) {
          console.error("Error fetching item details:", error)
          setError(error instanceof Error ? error.message : "Failed to fetch item details")
        } finally {
          setIsLoadingItem(false)
        }
      }
      
      fetchItemDetails()
    }
  }, [open, requestDetails])

  // Handle request approval
  const handleApprove = async () => {
    if (!requestId || !itemDetails) return
    
    setIsApproving(true)
    
    try {
      // 1. Approve the request
      const approveResponse = await fetch('/api/inventory/others-request/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          approver_notes: approverNotes
        }),
      })
      
      if (!approveResponse.ok) {
        const errorData = await approveResponse.json()
        throw new Error(errorData.error || 'Failed to approve request')
      }
      
      // 2. Update the item quantity
      if (requestDetails) {
        const newQuantity = itemDetails.currentQuantity - requestDetails.quantity
        
        const updateResponse = await fetch('/api/inventory/others-item', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: itemDetails.id,
            quantity: newQuantity,
            // If quantity reaches 0, mark as unavailable
            availability: newQuantity > 0
          }),
        })
        
        if (!updateResponse.ok) {
          const errorData = await updateResponse.json()
          throw new Error(errorData.error || 'Failed to update item quantity')
        }
      }
      
      toast.success("Request approved successfully")
      setApproverNotes("")
      onOpenChange(false)
      onSuccess()
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
      setItemDetails(null)
      setError(null)
    }
    onOpenChange(open)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-border/40">
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
            disabled={isApproving}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          {isLoadingItem ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Checking item availability...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs mt-1">Cannot approve this request due to insufficient quantity.</p>
            </div>
          ) : (
            <>
              {requestDetails && (
                <div className="bg-muted/50 p-4 rounded-md mb-4">
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
                    {itemDetails && (
                      <div className="p-2 bg-background/50 rounded border border-border/50">
                        <span className="text-xs text-muted-foreground">Available</span>
                        <p className="font-medium">{itemDetails.currentQuantity}</p>
                      </div>
                    )}
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
            </>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isApproving || isLoadingItem}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isApproving || isLoadingItem || !!error || !itemDetails}
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