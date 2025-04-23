"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Form schema for rejection reason
const rejectFormSchema = z.object({
  rejection_reason: z.string().optional(),
});

type RejectFormValues = z.infer<typeof rejectFormSchema>

// Paper request interface
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

interface RejectPaperRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  paperRequest: PaperRequest | null
  onSubmit: (requestId: string, data?: RejectFormValues) => Promise<void>
}

export function RejectPaperRequestForm({ 
  open, 
  onOpenChange, 
  paperRequest,
  onSubmit 
}: RejectPaperRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form
  const form = useForm<RejectFormValues>({
    resolver: zodResolver(rejectFormSchema),
    defaultValues: {
      rejection_reason: "",
    },
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  // Handle form submission
  const handleSubmit = async (data: RejectFormValues) => {
    if (!paperRequest) return;
    
    try {
      setIsLoading(true)
      await onSubmit(paperRequest.id, data)
      
      // Reset form
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error rejecting request:", error)
      toast.error("Failed to reject request")
    } finally {
      setIsLoading(false)
    }
  }

  if (!paperRequest) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject Paper Request</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this paper request?
          </DialogDescription>
        </DialogHeader>

        {/* Request details */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/40">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="font-medium">Requested by:</span> {paperRequest.user_name || "N/A"}</p>
            <p><span className="font-medium">Paper type:</span> {paperRequest.paper_type}</p>
            <p><span className="font-medium">GSM:</span> {paperRequest.gsm}</p>
            <p><span className="font-medium">Dimensions:</span> {paperRequest.width}x{paperRequest.length}cm</p>
          </div>
          {paperRequest.user_notes && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="font-medium">Notes:</p>
              <p className="text-sm mt-1">{paperRequest.user_notes}</p>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rejection_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Rejection (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter reason for rejection..."
                      className="bg-background/50 resize-none min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isLoading}
              >
                {isLoading ? "Rejecting..." : "Reject Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 