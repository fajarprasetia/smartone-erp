"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { DialogModal } from "@/components/ui/dialog-modal"

// Schema for request form validation
const requestOthersSchema = z.object({
  category: z.string({
    required_error: "Please select a category",
  }),
  item_name: z.string({
    required_error: "Please enter an item name",
  }).min(2, {
    message: "Item name must be at least 2 characters",
  }),
  quantity: z.coerce.number({
    required_error: "Please enter a quantity",
    invalid_type_error: "Quantity must be a number",
  }).positive({
    message: "Quantity must be greater than 0",
  }),
  unit: z.string({
    required_error: "Please select a unit",
  }),
  user_notes: z.string().optional(),
})

type RequestOthersFormData = z.infer<typeof requestOthersSchema>

interface RequestOthersFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RequestOthersFormData) => Promise<void>
}

interface OthersItem {
  id: string
  category: string
  item_name: string
  quantity: number
  unit: string
}

export function RequestOthersForm({
  open,
  onOpenChange,
  onSubmit,
}: RequestOthersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [items, setItems] = useState<OthersItem[]>([])
  const [filteredItems, setFilteredItems] = useState<OthersItem[]>([])
  const [selectedItem, setSelectedItem] = useState<OthersItem | null>(null)
  const [maxQuantity, setMaxQuantity] = useState<number>(1)
  
  // Initialize React Hook Form
  const form = useForm<RequestOthersFormData>({
    resolver: zodResolver(requestOthersSchema),
    defaultValues: {
      category: "",
      item_name: "",
      quantity: 1,
      unit: "",
      user_notes: "",
    },
  })

  // Fetch available items and categories
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/inventory/others-item?availability=YES')
        
        if (!response.ok) {
          throw new Error('Failed to fetch items')
        }
        
        const data = await response.json()
        setItems(data.items || [])
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.items.map((item: OthersItem) => item.category))] as string[]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error("Error fetching items:", error)
        toast.error(error instanceof Error ? error.message : "Failed to load items")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (open) {
      fetchItems()
    }
  }, [open])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSelectedItem(null)
      setFilteredItems([])
    }
  }, [open, form])

  // Filter items by selected category
  useEffect(() => {
    const category = form.getValues("category")
    if (category) {
      const filtered = items.filter(item => item.category === category)
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [form.watch("category"), items])

  // Update item details when item name is selected
  useEffect(() => {
    const itemName = form.getValues("item_name")
    if (itemName && filteredItems.length > 0) {
      const item = filteredItems.find(item => item.item_name === itemName)
      if (item) {
        setSelectedItem(item)
        form.setValue("unit", item.unit)
        setMaxQuantity(item.quantity)
        
        // Reset quantity if it's more than available
        const currentQty = form.getValues("quantity")
        if (currentQty > item.quantity) {
          form.setValue("quantity", item.quantity)
        }
      }
    }
  }, [form.watch("item_name"), filteredItems, form])

  // Handle form submission
  const handleSubmit = async (data: RequestOthersFormData) => {
    if (data.quantity > maxQuantity) {
      toast.error(`Maximum quantity available is ${maxQuantity}`)
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(data)
      form.reset()
      toast.success("Request submitted successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting request:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to submit request"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DialogModal
      open={open}
      onOpenChange={onOpenChange}
      title="Request Other Items"
      description="Fill out this form to request spare parts, stationery, or miscellaneous items."
      maxWidth="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Category Selection */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      form.setValue("item_name", "")
                      form.setValue("unit", "")
                      form.setValue("quantity", 1)
                    }}
                    value={field.value}
                    disabled={isLoading || categories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoading ? "Loading categories..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Item Selection */}
          <FormField
            control={form.control}
            name="item_name"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.getValues("category") || filteredItems.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={form.getValues("category") ? "Select an item" : "Select a category first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredItems.map((item) => (
                        <SelectItem key={item.id} value={item.item_name}>
                          {item.item_name} ({item.quantity} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                      max={maxQuantity}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      disabled={!selectedItem}
                    />
                  </FormControl>
                  {selectedItem && (
                    <p className="text-xs text-muted-foreground">
                      Maximum available: {maxQuantity}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Unit Display */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly disabled className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Notes Input */}
          <FormField
            control={form.control}
            name="user_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Why do you need this item?"
                    className="resize-none bg-background/50"
                    {...field}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogModal>
  )
} 