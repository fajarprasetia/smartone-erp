"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

// Define the OrderItem interface based on the database schema
interface OrderItem {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | null
  target_selesai?: Date | null
  customer_id?: number | null
  marketing_id?: number | null
  produk?: string | null
  asal_bahan?: string | null
  panjang?: number | null
  qty?: number | null
  harga?: number | null
  status?: string | null
  catatan?: string | null
  created_by_id?: string | null
  created_at?: Date | null
  updated_at?: Date | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
  marketing?: {
    id: string | number
    name: string
  } | null
}

// Customer interface
interface Customer {
  id: string | number
  nama: string
  telp?: string | null
}

// Marketing (User) interface
interface Marketing {
  id: string | number
  name: string
  email: string
}

// Order status options
const ORDER_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECT", label: "Rejected" },
  { value: "PROSES", label: "In Process" },
  { value: "SELESAI", label: "Completed" },
  { value: "DISERAHKAN", label: "Delivered" },
];

// Form schema
const formSchema = z.object({
  spk: z.string().optional(),
  no_project: z.string().optional(),
  tanggal: z.date().optional(),
  target_selesai: z.date().optional(),
  customer_id: z.coerce.number(),
  marketing_id: z.coerce.number(),
  produk: z.string().min(1, { message: "Product is required" }),
  asal_bahan: z.string().optional(),
  panjang: z.coerce.number().optional(),
  qty: z.coerce.number().optional(),
  harga: z.coerce.number().optional(),
  status: z.string(),
  catatan: z.string().optional(),
});

export default function EditOrderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketingUsers, setMarketingUsers] = useState<Marketing[]>([]);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      spk: "",
      no_project: "",
      tanggal: undefined,
      target_selesai: undefined,
      customer_id: 0,
      marketing_id: 0,
      produk: "",
      asal_bahan: "",
      panjang: undefined,
      qty: undefined,
      harga: undefined,
      status: "PENDING",
      catatan: "",
    },
  });

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/orders/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        
        const data = await response.json();
        setOrder(data);
        
        // Populate form with order data
        form.reset({
          spk: data.spk || "",
          no_project: data.no_project || "",
          tanggal: data.tanggal ? new Date(data.tanggal) : undefined,
          target_selesai: data.target_selesai ? new Date(data.target_selesai) : undefined,
          customer_id: data.customer_id || 0,
          marketing_id: data.marketing_id || 0,
          produk: data.produk || "",
          asal_bahan: data.asal_bahan || "",
          panjang: data.panjang || undefined,
          qty: data.qty || undefined,
          harga: data.harga || undefined,
          status: data.status || "PENDING",
          catatan: data.catatan || "",
        });
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, form]);

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch("/api/customers");
        
        if (!response.ok) {
          throw new Error("Failed to fetch customers");
        }
        
        const data = await response.json();
        setCustomers(data.customers || []);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customers");
      }
    };

    fetchCustomers();
  }, []);

  // Fetch marketing users
  useEffect(() => {
    const fetchMarketingUsers = async () => {
      try {
        const response = await fetch("/api/users?role=marketing");
        
        if (!response.ok) {
          throw new Error("Failed to fetch marketing users");
        }
        
        const data = await response.json();
        setMarketingUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching marketing users:", error);
        toast.error("Failed to load marketing users");
      }
    };

    fetchMarketingUsers();
  }, []);

  // Format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "PPP");
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update order");
      }
      
      toast.success("Order updated successfully");
      router.push("/order");
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
        <Button variant="outline" onClick={() => router.push("/order")}>
          Back to Orders
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Update the order information below. Click save when you're done.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SPK Number */}
                <FormField
                  control={form.control}
                  name="spk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SPK Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SPK number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project Number */}
                <FormField
                  control={form.control}
                  name="no_project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter project number" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="tanggal"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? formatDate(field.value) : "Select date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
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

                {/* Target Completion Date */}
                <FormField
                  control={form.control}
                  name="target_selesai"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Completion Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                            >
                              {field.value ? formatDate(field.value) : "Select target date"}
                              <CalendarIcon className="ml-auto h-4 w-4" />
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

                {/* Customer */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Customer</FormLabel>
                      <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={customerOpen}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? customers.find(
                                    (customer) => customer.id.toString() === field.value.toString()
                                  )?.nama || "Select customer"
                                : "Select customer"}
                              <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" side="bottom" align="start">
                          <Command>
                            <CommandInput placeholder="Search customer..." />
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {customers.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={customer.nama}
                                  onSelect={() => {
                                    form.setValue("customer_id", Number(customer.id));
                                    setCustomerOpen(false);
                                  }}
                                >
                                  {customer.nama}
                                  {customer.telp && ` (${customer.telp})`}
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

                {/* Marketing */}
                <FormField
                  control={form.control}
                  name="marketing_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Marketing</FormLabel>
                      <Popover open={marketingOpen} onOpenChange={setMarketingOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={marketingOpen}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? marketingUsers.find(
                                    (user) => user.id.toString() === field.value.toString()
                                  )?.name || "Select marketing"
                                : "Select marketing"}
                              <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" side="bottom" align="start">
                          <Command>
                            <CommandInput placeholder="Search marketing..." />
                            <CommandEmpty>No marketing found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {marketingUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.name}
                                  onSelect={() => {
                                    form.setValue("marketing_id", Number(user.id));
                                    setMarketingOpen(false);
                                  }}
                                >
                                  {user.name} ({user.email})
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

                {/* Product */}
                <FormField
                  control={form.control}
                  name="produk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fabric Origin */}
                <FormField
                  control={form.control}
                  name="asal_bahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric Origin</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter fabric origin" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Length */}
                <FormField
                  control={form.control}
                  name="panjang"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter length"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="qty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
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
                        <Input
                          type="number"
                          placeholder="Enter price"
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                        />
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
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional notes"
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.push("/order")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
} 