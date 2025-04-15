"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
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

  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

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

  if (!open || !paperRequest) return null

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
            <h2 className="text-lg font-semibold">Reject Paper Request</h2>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to reject this paper request?
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

        <div className="p-6">
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
              
              <div className="flex justify-end space-x-2 pt-4">
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
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
} 