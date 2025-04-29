"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Check, ChevronsUpDown, X } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Schema for request form validation
const requestOthersSchema = z.object({
  item_id: z.string({
    required_error: "Please select an item",
  }),
  quantity: z.coerce.number({
    required_error: "Please enter a quantity",
    invalid_type_error: "Quantity must be a number",
  }).positive({
    message: "Quantity must be greater than 0",
  }),
  requested_by_id: z.string({
    required_error: "Please select a requester",
  }),
  user_notes: z.string().optional(),
})

type RequestOthersFormData = z.infer<typeof requestOthersSchema>

interface OthersItem {
  id: string
  qr_code: string | null
  category: string
  item_name: string
  description: string | null
  quantity: number
  unit: string
  location: string | null
  notes: string | null
  availability: boolean
  user_id: string
  taken_by_user_id: string | null
  created_at: string
  user: {
    name: string
  }
}

interface User {
  id: string
  name: string
  email: string
}

interface RequestOthersFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: OthersItem
}

export function RequestOthersForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: RequestOthersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<OthersItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userSearch, setUserSearch] = useState("")
  const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false)
  const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false)

  // Initialize React Hook Form
  const form = useForm<RequestOthersFormData>({
    resolver: zodResolver(requestOthersSchema),
    defaultValues: {
      item_id: initialData?.id || "",
      quantity: 1,
      requested_by_id: "",
      user_notes: "",
    },
  })

  // Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch("/api/inventory/others-item?availability=YES")
        if (!response.ok) {
          throw new Error("Failed to fetch items")
        }
        const data = await response.json()
        setItems(data.items || [])
      } catch (error) {
        console.error("Error fetching items:", error)
        toast.error("Failed to load available items")
      }
    }

    if (open) {
      fetchItems()
    }
  }, [open])

  // Fetch users when search changes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/users?search=${encodeURIComponent(userSearch)}`)
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast.error("Failed to load users")
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      fetchUsers()
    }
  }, [open, userSearch])

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (!open) {
      form.reset()
      setUserSearch("")
    } else if (initialData) {
      form.reset({
        item_id: initialData.id,
        quantity: 1,
        requested_by_id: "",
        user_notes: "",
      })
    }
  }, [open, initialData, form])

  // Handle form submission
  const onSubmit = async (data: RequestOthersFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/inventory/others-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create request")
      }

      toast.success("Request created successfully")
      form.reset()
      onOpenChange(false)
      if (typeof onSuccess === 'function') {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create request")
    } finally {
      setIsSubmitting(false)
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
            <h2 className="text-lg font-semibold">Request Item</h2>
            <p className="text-sm text-muted-foreground">
              Request an item from inventory
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="item_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.item_name} ({item.quantity} {item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requested_by_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requester</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a requester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
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

              <FormField
                control={form.control}
                name="user_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes about your request"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Add any specific requirements or details about your request.
                    </FormDescription>
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
} 