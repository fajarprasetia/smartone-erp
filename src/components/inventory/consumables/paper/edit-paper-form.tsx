"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { X } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Form schema for editing paper
const editPaperSchema = z.object({
  barcode_id: z.string().optional(),
  supplier: z.string().optional(),
  paper_type: z.string().min(1, { message: "Paper type is required" }),
  gsm: z.string().min(1, { message: "GSM is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  remaining_length: z.string().min(1, { message: "Remaining length is required" }),
  notes: z.string().optional(),
})

type EditPaperFormValues = z.infer<typeof editPaperSchema>

interface PaperStock {
  id: string
  barcode_id: string | null
  qrCode?: string | null
  supplier: string | null
  manufacturer?: string | null
  gsm: string | number
  width: string | number
  height?: string | number
  length: string | number | null
  used: string | null
  waste: string | null
  remaining_length: string
  remainingLength?: string | number | null
  added_by: string
  addedByUserId: {
    name: string
  }
  taken_by: string | null
  notes: string | null
  availability: "YES" | "NO"
  created_at: string
  dateAdded?: string
  updated_by: string
  user_name?: string
  paper_type?: string
  type?: string
  paperType?: string
  approved?: boolean
  name?: string
}

interface EditPaperFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    barcode_id?: string
    supplier?: string
    paper_type: string
    gsm: number
    width: number
    length: number
    remaining_length: number
    notes?: string
  }) => Promise<void>
  stock: PaperStock
}

export function EditPaperForm({ open, onOpenChange, onSubmit, stock }: EditPaperFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { data: session } = useSession()
  const userId = session?.user?.id
  const [remainingLength, setRemainingLength] = useState<string>(stock.remaining_length || stock.remainingLength?.toString() || "")

  // Initialize form with stock values
  const form = useForm<EditPaperFormValues>({
    resolver: zodResolver(editPaperSchema),
    defaultValues: {
      barcode_id: stock.barcode_id || stock.qrCode || "",
      supplier: stock.supplier || stock.manufacturer || "",
      paper_type: stock.paperType || stock.paper_type || stock.type || "Sublimation Paper",
      gsm: String(stock.gsm),
      width: String(stock.width),
      length: stock.length ? String(stock.length) : "",
      remaining_length: stock.remaining_length || stock.remainingLength?.toString() || "",
      notes: stock.notes || "",
    },
  })

  // Update form values when stock changes
  useEffect(() => {
    if (stock) {
      form.reset({
        barcode_id: stock.barcode_id || stock.qrCode || "",
        supplier: stock.supplier || stock.manufacturer || "",
        paper_type: stock.paperType || stock.paper_type || stock.type || "Sublimation Paper",
        gsm: String(stock.gsm),
        width: String(stock.width),
        length: stock.length ? String(stock.length) : "",
        remaining_length: stock.remaining_length || stock.remainingLength?.toString() || "",
        notes: stock.notes || "",
      });
      setRemainingLength(stock.remaining_length || stock.remainingLength?.toString() || "");
    }
  }, [stock, form]);

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
  const handleSubmit = async (data: EditPaperFormValues) => {
    try {
      setIsLoading(true)
      
      // Add remaining_length to the data if not already set
      if (!data.remaining_length) {
        data.remaining_length = data.length
      }
      
      // Format data to match the API expectations
      const formattedData = {
        barcode_id: data.barcode_id,
        supplier: data.supplier,
        paper_type: data.paper_type,
        gsm: parseInt(data.gsm),
        width: parseFloat(data.width),
        length: parseFloat(data.length),
        remaining_length: parseFloat(data.remaining_length),
        notes: data.notes,
      }
      
      await onSubmit(formattedData)
      
      // Reset form state
      setIsLoading(false)
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting paper data:", error)
      toast.error("Failed to update paper")
      setIsLoading(false)
    }
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
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-semibold">Edit Paper Stock</h2>
            <p className="text-sm text-muted-foreground">
              Update paper stock information
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="barcode_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter barcode"
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter supplier name"
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paper_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paper Type</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select paper type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sublimation Paper">Sublimation Paper</SelectItem>
                          <SelectItem value="DTF Film">DTF Film</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="gsm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GSM*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter GSM"
                          className="bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width* (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          className="bg-background/50" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length* (cm)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0" 
                          className="bg-background/50" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remaining_length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remaining Length* (cm)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        className="bg-background/50"
                        onChange={(e) => {
                          field.onChange(e);
                          setRemainingLength(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Additional information about this paper stock" 
                        className="resize-none bg-background/50" 
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Paper Stock"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
} 