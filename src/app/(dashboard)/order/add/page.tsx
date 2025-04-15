"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronLeft, Calendar as CalendarIcon, Loader2, ChevronsUpDown, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  jenisProduk: z.object({
    PRINT: z.boolean().default(false),
    PRESS: z.boolean().default(false),
    CUTTING: z.boolean().default(false),
    DTF: z.boolean().default(false),
    SEWING: z.boolean().default(false)
  }),
  asalBahan: z.string().min(1, { message: "Fabric origin is required" }),
  namaBahan: z.string().optional(),
  panjangKertas: z.string().optional(),
  gsmKertas: z.string().optional(),
  notes: z.string().optional(),
  targetSelesai: z.date().optional().nullable(),
  harga: z.string().optional(),
  tax: z.boolean().default(false),
  taxPercentage: z.string().optional(),
  totalPrice: z.string().optional(),
  spk: z.string().optional(),
  fileDesain: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Customer {
  id: string
  nama: string
  telp: string | null
}

export default function AddOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [marketingUsers, setMarketingUsers] = useState<Array<{ id: string; name: string; email: string }>>([])  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  const [isMarketingOpen, setIsMarketingOpen] = useState(false)
  const [fabricNames, setFabricNames] = useState<Array<{ id: string; name: string }>>([])  
  const [isFabricNameOpen, setIsFabricNameOpen] = useState(false)
  
  // Initialize form with default values
  const [spkNumber, setSpkNumber] = useState<string>("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      marketing: "",
      tanggal: new Date(),
      jumlah: "",
      jenisProduk: {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: false,
        SEWING: false
      },
      asalBahan: "SMARTONE",
      namaBahan: "",
      panjangKertas: "",
      gsmKertas: "",
      notes: "",
      targetSelesai: null,
      harga: "",
      tax: false,
      taxPercentage: "11", // Default tax percentage
      totalPrice: "",
      spk: "",
      fileDesain: "",
    },
  })
  
  // Fetch SPK number when component mounts
  useEffect(() => {
    const fetchSpkNumber = async () => {
      try {
        const response = await fetch("/api/orders/spk");
        if (!response.ok) {
          throw new Error("Failed to fetch SPK number");
        }
        const data = await response.json();
        setSpkNumber(data.spkNumber);
        form.setValue("spk", data.spkNumber);
      } catch (error) {
        console.error("Error fetching SPK number:", error);
        toast.error("Failed to generate SPK number");
      }
    };

    fetchSpkNumber();
  }, [form]);
  
  // Fetch customers and marketing users for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, marketingResponse] = await Promise.all([
          fetch("/api/marketing/customers"),
          fetch("/api/marketing/users")
        ]);
        
        const customersData = await customersResponse.json();
        const marketingData = await marketingResponse.json();
        
        if (Array.isArray(customersData)) {
          setCustomers(customersData);
        }
        
        if (Array.isArray(marketingData)) {
          setMarketingUsers(marketingData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    
    fetchData();
  }, [])
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy")
  }
  
  // Calculate total price based on quantity, unit price and tax
  useEffect(() => {
    const quantity = parseFloat(form.watch("jumlah") || "0");
    const unitPrice = parseFloat(form.watch("harga") || "0");
    const isTaxApplied = form.watch("tax");
    const taxPercentage = parseFloat(form.watch("taxPercentage") || "0");
    
    if (quantity && unitPrice) {
      let total = quantity * unitPrice;
      
      if (isTaxApplied && taxPercentage) {
        total += total * (taxPercentage / 100);
      }
      
      // Store the raw number value without formatting
      form.setValue("totalPrice", Math.round(total).toString());
    } else {
      form.setValue("totalPrice", "");
    }
  }, [form.watch("jumlah"), form.watch("harga"), form.watch("tax"), form.watch("taxPercentage"), form]);
  
  // Fetch fabric names when customer or fabric origin changes
  useEffect(() => {
    const fetchFabricNames = async () => {
      try {
        const asalBahan = form.watch("asalBahan");
        const customerId = form.watch("customerId");
        
        // Only fetch if we have both values
        if (!asalBahan || (asalBahan === "CUSTOMER" && !customerId)) {
          setFabricNames([]);
          return;
        }
        
        // Determine which customer ID to use
        const targetCustomerId = asalBahan === "SMARTONE" ? "22" : customerId;
        
        const response = await fetch(`/api/inventory/fabrics?customerId=${targetCustomerId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch fabric names");
        }
        
        const data = await response.json();
        setFabricNames(data);
      } catch (error) {
        console.error("Error fetching fabric names:", error);
        toast.error("Failed to load fabric options");
      }
    };
    
    fetchFabricNames();
  }, [form.watch("asalBahan"), form.watch("customerId")]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      // Convert jenisProduk object to string format for API
      const selectedTypes = Object.entries(data.jenisProduk)
        .filter(([_, isSelected]) => isSelected)
        .map(([type]) => type);
      
      const jenisProdukString = selectedTypes.length > 0 ? selectedTypes.join(", ") : "";
      
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          // Convert jenisProduk from object to string
          jenisProduk: jenisProdukString,
          // Include new fields
          asalBahan: data.asalBahan,
          namaBahan: data.namaBahan,
          panjangKertas: data.panjangKertas,
          gsmKertas: data.gsmKertas,
          tax: data.tax,
          taxPercentage: data.tax ? data.taxPercentage : null,
          totalPrice: data.totalPrice,
          // Remove status field as it's no longer needed
          status: "PENDING", // Default status for new orders
          // Ensure dates are properly formatted for the API
          tanggal: data.tanggal.toISOString(),
          targetSelesai: data.targetSelesai ? data.targetSelesai.toISOString() : null,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create order")
      }
      
      toast.success("Order created successfully")
      
      // Redirect back to order list
      router.push("/order")
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Failed to create order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
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
          <CardTitle>Create New Order</CardTitle>
          <CardDescription>
            Enter the details for the new order.
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
                                ? customers.find((customer) => customer.id === field.value)?.nama
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
                                  value={customer.nama}
                                  onSelect={() => {
                                    form.setValue("customerId", customer.id)
                                    setIsCustomerOpen(false)
                                  }}
                                >
                                  {customer.nama}
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
                        <PopoverContent className="w-auto p-0 max-h-[85vh] overflow-y-auto" align="start">
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
                        <Input
                          placeholder="SPK number"
                          {...field}
                          readOnly
                          className="bg-muted"
                        />
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
                    <FormItem className="flex flex-col">
                      <FormLabel>Marketing</FormLabel>
                      <Popover open={isMarketingOpen} onOpenChange={setIsMarketingOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isMarketingOpen}
                              className="justify-between"
                            >
                              {field.value
                                ? marketingUsers.find((user) => user.name === field.value)?.name
                                : "Select Marketing"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                          <Command>
                            <CommandInput placeholder="Search marketing users..." />
                            <CommandEmpty>No marketing user found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {marketingUsers.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.name}
                                  onSelect={() => {
                                    form.setValue("marketing", user.name)
                                    setIsMarketingOpen(false)
                                  }}
                                >
                                  {user.name}
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
                
                {/* Fabric Origins */}
                <FormField
                  control={form.control}
                  name="asalBahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric Origins*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fabric origin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SMARTONE">SMARTONE</SelectItem>
                          <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Fabric Name */}
                <FormField
                  control={form.control}
                  name="namaBahan"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fabric Name</FormLabel>
                      <Popover open={isFabricNameOpen} onOpenChange={setIsFabricNameOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isFabricNameOpen}
                              className="justify-between w-full"
                              disabled={fabricNames.length === 0}
                            >
                              {field.value
                                ? fabricNames.find((fabric) => fabric.name === field.value)?.name || field.value
                                : "Select fabric"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                          <Command>
                            <CommandInput placeholder="Search fabric..." />
                            <CommandEmpty>No fabric found.</CommandEmpty>
                            <CommandGroup className="max-h-[300px] overflow-y-auto">
                              {fabricNames.map((fabric) => (
                                <CommandItem
                                  key={fabric.id}
                                  value={fabric.name}
                                  onSelect={() => {
                                    form.setValue("namaBahan", fabric.name);
                                    setIsFabricNameOpen(false);
                                  }}
                                >
                                  {fabric.name}{fabric.length ? ` - ${fabric.length} m` : ""}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {fabricNames.length === 0 && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {form.watch("asalBahan") === "CUSTOMER" && !form.watch("customerId")
                            ? "Select a customer first"
                            : "No fabrics available"}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Paper Length */}
                <FormField
                  control={form.control}
                  name="panjangKertas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper Length</FormLabel>
                      <FormControl>
                        <Input placeholder="Paper length" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Paper GSM */}
                <FormField
                  control={form.control}
                  name="gsmKertas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paper GSM</FormLabel>
                      <FormControl>
                        <Input placeholder="Paper GSM" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Product Type */}
                <div className="col-span-2">
                  <FormLabel className="block mb-2">Product Type*</FormLabel>
                  
                  {/* Shortcut Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("jenisProduk.PRINT", true);
                        form.setValue("jenisProduk.PRESS", true);
                      }}
                    >
                      PRINT PRESS
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("jenisProduk.PRINT", true);
                        form.setValue("jenisProduk.PRESS", true);
                        form.setValue("jenisProduk.CUTTING", true);
                      }}
                    >
                      PRINT PRESS CUTTING
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("jenisProduk.PRINT", true);
                        form.setValue("jenisProduk.PRESS", true);
                        form.setValue("jenisProduk.CUTTING", true);
                        form.setValue("jenisProduk.SEWING", true);
                      }}
                    >
                      FULL ORDER
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue("jenisProduk.PRINT", false);
                        form.setValue("jenisProduk.PRESS", false);
                        form.setValue("jenisProduk.CUTTING", false);
                        form.setValue("jenisProduk.DTF", false);
                        form.setValue("jenisProduk.SEWING", false);
                      }}
                    >
                      CANCEL
                    </Button>
                  </div>
                  
                  {/* Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="jenisProduk.PRINT"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            PRINT
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jenisProduk.PRESS"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            PRESS
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jenisProduk.CUTTING"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            CUTTING
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jenisProduk.DTF"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            DTF
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="jenisProduk.SEWING"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            SEWING
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormMessage />
                </div>
                
                {/* Quantity */}
                <FormField
                  control={form.control}
                  name="jumlah"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity (m)*</FormLabel>
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
                      <FormLabel>Unit Price</FormLabel>
                      <FormControl>
                        <Input placeholder="Price" {...field} />
                      </FormControl>
                      {field.value && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(parseFloat(field.value))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Tax Checkbox */}
                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Apply Tax
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Tax Percentage - Only shown if tax is checked */}
                {form.watch("tax") && (
                  <FormField
                    control={form.control}
                    name="taxPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Percentage (%)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tax %" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Total Price (Calculated) */}
                <FormField
                  control={form.control}
                  name="totalPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Price</FormLabel>
                      <FormControl>
                        <Input placeholder="Total Price" {...field} readOnly className="bg-muted" />
                      </FormControl>
                      {field.value && (
                        <div className="text-sm font-medium mt-1">
                          {formatCurrency(parseFloat(field.value))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Target Completion Date */}
                
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
                        <PopoverContent className="w-auto p-0 max-h-[85vh] overflow-y-auto" align="start">
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
                  Create Order
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}