"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, QrCode } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Schema for add item form validation
const addOthersItemSchema = z.object({
  qr_code: z.string().optional(),
  category: z.string({
    required_error: "Please select a category",
  }),
  item_name: z.string({
    required_error: "Please enter an item name",
  }).min(2, {
    message: "Item name must be at least 2 characters",
  }),
  description: z.string().optional(),
  quantity: z.coerce.number({
    required_error: "Please enter a quantity",
    invalid_type_error: "Quantity must be a number",
  }).positive({
    message: "Quantity must be greater than 0",
  }),
  unit: z.string({
    required_error: "Please select a unit",
  }),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type AddOthersItemFormData = z.infer<typeof addOthersItemSchema>

interface AddOthersFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddOthersForm({
  open,
  onOpenChange,
  onSuccess,
}: AddOthersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  
  // Initialize React Hook Form
  const form = useForm<AddOthersItemFormData>({
    resolver: zodResolver(addOthersItemSchema),
    defaultValues: {
      qr_code: "",
      category: "",
      item_name: "",
      description: "",
      quantity: 1,
      unit: "",
      location: "",
      notes: "",
    },
  })

  // Reset form when dialog opens/closes
  if (!open && form.formState.isDirty) {
    form.reset()
  }

  // Handle form submission
  const onSubmit = async (data: AddOthersItemFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/inventory/others-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add item")
      }
      
      toast.success("Item added to inventory successfully")
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add item")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle scanning barcode (mock function for now)
  const handleScanBarcode = () => {
    setIsScanning(true)
    
    // Simulate barcode scanning
    setTimeout(() => {
      // Generate a random QR code value as an example
      const randomQRCode = `ITEM-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      form.setValue("qr_code", randomQRCode)
      setIsScanning(false)
      toast.success("QR code scanned successfully")
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add New Item to Inventory</DialogTitle>
          <DialogDescription>
            Fill out this form to add a new item to the inventory.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* QR Code */}
            <FormField
              control={form.control}
              name="qr_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>QR/Barcode (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="Enter or scan QR code"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleScanBarcode}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4 mr-2" />
                      )}
                      Scan
                    </Button>
                  </div>
                  <FormDescription>
                    Optional identifier for the item. If left blank, a unique ID will be generated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Item Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category Selection */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SPAREPARTS">Spare Parts</SelectItem>
                          <SelectItem value="STATIONERY">Office Stationery</SelectItem>
                          <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Item Name */}
              <FormField
                control={form.control}
                name="item_name"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Quantity and Unit Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Quantity Input */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Unit Input */}
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="roll">Roll</SelectItem>
                          <SelectItem value="set">Set</SelectItem>
                          <SelectItem value="bottle">Bottle</SelectItem>
                          <SelectItem value="pair">Pair</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="meter">Meter</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Location Input */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter storage location (e.g., 'Cabinet A3', 'Warehouse Shelf B')"
                      {...field}
                      value={field.value || ""}
                      className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Description Input */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description of the item"
                      {...field}
                      value={field.value || ""}
                      className="resize-none bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes Input */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes about the item"
                      {...field}
                      value={field.value || ""}
                      className="resize-none bg-background/50"
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add to Inventory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 