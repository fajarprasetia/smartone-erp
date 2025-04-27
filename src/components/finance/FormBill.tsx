"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

const billFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  billNumber: z.string().min(1, "Bill number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
})

const vendorSchema = z.object({
  name: z.string().min(1, "Vendor name is required"),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  taxId: z.string().optional(),
  notes: z.string().optional(),
})

type BillFormValues = z.infer<typeof billFormSchema>
type VendorFormValues = z.infer<typeof vendorSchema>

export function FormBill() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [isCreatingVendor, setIsCreatingVendor] = useState(false)

  const billForm = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      vendorId: "",
      billNumber: "",
      issueDate: "",
      dueDate: "",
      amount: "",
      description: "",
      notes: "",
    },
  })

  const vendorForm = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      taxId: "",
      notes: "",
    },
  })

  useEffect(() => {
    async function fetchVendors() {
      try {
        const response = await fetch("/api/finance/vendors")
        if (!response.ok) {
          throw new Error("Failed to fetch vendors")
        }
        const data = await response.json()
        setVendors(data)
      } catch (error) {
        console.error("Error fetching vendors:", error)
        toast.error("Failed to fetch vendors")
      }
    }

    fetchVendors()
  }, [])

  const handleCreateVendor = async (data: VendorFormValues) => {
    setIsCreatingVendor(true)
    try {
      const response = await fetch("/api/finance/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Failed to create vendor")
      }

      const newVendor = await response.json()
      setVendors((prev) => [...prev, newVendor])
      billForm.setValue("vendorId", newVendor.id)
      setShowNewVendor(false)
      vendorForm.reset()
      toast.success("Vendor created successfully")
    } catch (error) {
      console.error("Error creating vendor:", error)
      toast.error("Failed to create vendor")
    } finally {
      setIsCreatingVendor(false)
    }
  }

  async function onSubmit(data: BillFormValues) {
    setIsLoading(true)
    try {
      const response = await fetch("/api/finance/bills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create bill")
      }

      toast.success("Bill created successfully")
      router.refresh()
      billForm.reset()
    } catch (error) {
      toast.error("Failed to create bill")
      console.error("Error creating bill:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...billForm}>
      <form onSubmit={billForm.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <FormField
            control={billForm.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Vendor</FormLabel>
                <div className="flex gap-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowNewVendor(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {showNewVendor && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create New Vendor</h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowNewVendor(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Form {...vendorForm}>
              <form
                onSubmit={vendorForm.handleSubmit(handleCreateVendor)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vendorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter vendor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vendorForm.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter contact person name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vendorForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vendorForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={vendorForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter complete address"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={vendorForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tax ID (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={vendorForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes (optional)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewVendor(false)}
                    disabled={isCreatingVendor}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingVendor}>
                    {isCreatingVendor ? "Creating..." : "Create Vendor"}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        )}

        <FormField
          control={billForm.control}
          name="billNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bill Number</FormLabel>
              <FormControl>
                <Input placeholder="Enter bill number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={billForm.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={billForm.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={billForm.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Enter amount" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={billForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={billForm.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any additional notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Bill"}
        </Button>
      </form>
    </Form>
  )
} 