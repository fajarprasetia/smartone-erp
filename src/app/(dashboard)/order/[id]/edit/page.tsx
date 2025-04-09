"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parse } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronLeft, Calendar as CalendarIcon, Loader2 } from "lucide-react"
import React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"

// Define the form schema with validation rules
const formSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required" }),
  marketing: z.string().optional(),
  tanggal: z.date(),
  jumlah: z.string().min(1, { message: "Quantity is required" }),
  jenisProduk: z.string().min(1, { message: "Product type is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  notes: z.string().optional(),
  targetSelesai: z.date().optional().nullable(),
  harga: z.string().optional(),
  spk: z.string().optional(),
  fileDesain: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Customer {
  id: string
  name: string
}

export default function EditOrderPage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use() to avoid warnings
  const orderId = React.use(Promise.resolve(params.id))
  
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  
  // Initialize form with default empty values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      marketing: "",
      tanggal: new Date(),
      jumlah: "",
      jenisProduk: "",
      status: "",
      notes: "",
      targetSelesai: null,
      harga: "",
      spk: "",
      fileDesain: "",
    },
  })
  
  // Fetch customers for dropdown
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/marketing/customers")
        const data = await response.json()
        
        if (Array.isArray(data)) {
          setCustomers(data)
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast.error("Failed to load customers")
      }
    }
    
    fetchCustomers()
  }, [])
  
  // Fetch existing order data
  useEffect(() => {
    const fetchOrderData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch order")
        }
        
        const orderData = await response.json()
        
        // Format dates properly
        const formattedData = {
          ...orderData,
          tanggal: orderData.tanggal ? new Date(orderData.tanggal) : new Date(),
          targetSelesai: orderData.targetSelesai ? new Date(orderData.targetSelesai) : null,
        }
        
        // Reset form with fetched data
        form.reset({
          customerId: formattedData.customerId || "",
          marketing: formattedData.marketing || "",
          tanggal: formattedData.tanggal,
          jumlah: formattedData.jumlah || "",
          jenisProduk: formattedData.jenisProduk || "",
          status: formattedData.status || "",
          notes: formattedData.notes || "",
          targetSelesai: formattedData.targetSelesai,
          harga: formattedData.harga || "",
          spk: formattedData.spk || "",
          fileDesain: formattedData.fileDesain || "",
        })
      } catch (error) {
        console.error("Error fetching order data:", error)
        toast.error("Failed to load order data")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrderData()
  }, [orderId, form])
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy")
  }
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Ensure dates are properly formatted for the API
          tanggal: data.tanggal.toISOString(),
          targetSelesai: data.targetSelesai ? data.targetSelesai.toISOString() : null,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update order")
      }
      
      toast.success("Order updated successfully")
      
      // Redirect back to order list
      router.push("/order")
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Failed to update order")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading order data...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/order")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Order</CardTitle>
          <CardDescription>
            Update the details of the existing order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Selection */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Customer*</FormLabel>
                      <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isCustomerOpen}
                              className="justify-between"
                            >
                              {field.value
                                ? customers.find((customer) => customer.id === field.value)?.name
                                : "Select Customer"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                          <Command>
                            <CommandInput placeholder="Search customers..." />
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.id}
                                  onSelect={() => {
                                    form.setValue("customerId", customer.id)
                                    setIsCustomerOpen(false)
                                  }}
                                >
                                  {customer.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Order Date */}
                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Order Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                formatDate(field.value)
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
                
                {/* SPK Number */}
                <FormField
                  control={form.control}
                  name="spk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SPK Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SPK number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Marketing */}
                <FormField
                  control={form.control}
                  name="marketing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marketing</FormLabel>
                      <FormControl>
                        <Input placeholder="Marketing name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Product Type */}
                <FormField
                  control={form.control}
                  name="jenisProduk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Type*</FormLabel>
                      <FormControl>
                        <Input placeholder="Type of product" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="jumlah"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input placeholder="Quantity" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Price */}
                <FormField
                  control={form.control}
                  name="harga"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input placeholder="Price" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="PROCESSING">Processing</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Target Completion Date */}
                <FormField
                  control={form.control}
                  name="targetSelesai"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className="pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                formatDate(field.value)
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
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Design File */}
                <FormField
                  control={form.control}
                  name="fileDesain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Design File</FormLabel>
                      <FormControl>
                        <Input placeholder="File path or URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes for this order"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="px-0 pb-0 flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/order")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Order
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 