"use client"

import { useState, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { CalendarIcon } from "lucide-react"

const formSchema = z.object({
  amount: z
    .number()
    .min(1, "Amount must be greater than 0"),
  paymentDate: z.date({
    required_error: "Payment date is required",
  }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

export type PaymentFormValues = z.infer<typeof formSchema>

interface PaymentFormProps {
  isProcessing: boolean
  documentId: string // Invoice ID or Bill ID
  documentNumber: string // Invoice Number or Bill Number
  documentTotal: number
  documentBalance: number
  documentType: "invoice" | "bill"
  onSubmit: (values: PaymentFormValues) => Promise<void>
  onCancel: () => void
}

export function PaymentForm({
  isProcessing,
  documentId,
  documentNumber,
  documentTotal,
  documentBalance,
  documentType,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: documentBalance,
      paymentDate: new Date(),
      paymentMethod: "BANK_TRANSFER",
      reference: "",
      notes: "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      // Check file size (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.")
        return
      }
      
      // Check file type (only images and PDFs)
      if (
        !['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(
          selectedFile.type
        )
      ) {
        toast.error("Only images (JPEG, PNG, GIF) and PDF files are allowed.")
        return
      }
      
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (values: PaymentFormValues) => {
    try {
      // If there's a file, handle it with FormData
      if (file) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("data", JSON.stringify(values))
        formData.append("documentId", documentId)
        
        // Upload the file first
        const uploadResponse = await fetch("/api/finance/upload", {
          method: "POST",
          body: formData,
        })
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload file")
        }
        
        const { fileUrl } = await uploadResponse.json()
        
        // Add the fileUrl to the values
        values = { ...values, fileUrl }
      }
      
      // Submit the form
      await onSubmit(values)
    } catch (error) {
      console.error("Payment submission error:", error)
      toast.error("Failed to process payment. Please try again.")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Document Type</div>
            <div className="font-bold capitalize">{documentType}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Document Number</div>
            <div className="font-bold">{documentNumber}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Total Amount</div>
            <div className="font-bold">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(documentTotal)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Balance Due</div>
            <div className="font-bold">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
              }).format(documentBalance)}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Payment Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                  <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                  <SelectItem value="ONLINE_PAYMENT">Online Payment</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference</FormLabel>
              <FormControl>
                <Input
                  placeholder="Payment reference (optional)"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Transaction ID, check number, etc.
              </FormDescription>
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
                  placeholder="Additional notes (optional)"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel htmlFor="receipt">Attach Receipt</FormLabel>
          <Input
            id="receipt"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,application/pdf"
            className="mt-1"
          />
          <FormDescription>
            Upload receipt or proof of payment (max 2MB, JPEG, PNG, GIF, PDF)
          </FormDescription>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 