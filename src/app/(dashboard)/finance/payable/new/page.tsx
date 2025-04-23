"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

// Schema for form validation
const billSchema = z.object({
  vendorId: z.string().min(1, { message: "Vendor is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  issueDate: z.date({ required_error: "Issue date is required" }),
  dueDate: z.date({ required_error: "Due date is required" }),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(1, { message: "Description is required" }),
      quantity: z.coerce.number().min(0.01, { message: "Quantity must be greater than 0" }),
      unitPrice: z.coerce.number().min(0.01, { message: "Unit price must be greater than 0" })
    })
  ).min(1, { message: "At least one item is required" })
});

type BillFormValues = z.infer<typeof billSchema>;

type Vendor = {
  id: string;
  name: string;
};

export default function NewBillPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);

  // Default form values
  const defaultValues: BillFormValues = {
    vendorId: "",
    description: "",
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: "",
    items: [
      { description: "", quantity: 1, unitPrice: 0 }
    ]
  };

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate item amount
  const calculateItemAmount = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
  };

  // Calculate total amount
  const calculateTotal = () => {
    const items = form.getValues("items");
    return items.reduce((total, item) => {
      return total + calculateItemAmount(item.quantity || 0, item.unitPrice || 0);
    }, 0);
  };

  // Fetch vendors for the select dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch("/api/vendors");
        if (!response.ok) throw new Error("Failed to fetch vendors");
        
        const data = await response.json();
        setVendors(data.vendors || []);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        toast({
          title: "Error",
          description: "Failed to load vendors",
          variant: "destructive",
        });
      } finally {
        setIsLoadingVendors(false);
      }
    };

    fetchVendors();
  }, []);

  // Submit handler
  const onSubmit = async (values: BillFormValues) => {
    setIsSubmitting(true);

    try {
      // Calculate total amount
      const totalAmount = calculateTotal();

      // Prepare data for API
      const billData = {
        ...values,
        totalAmount,
        items: values.items.map((item) => ({
          ...item,
          amount: calculateItemAmount(item.quantity, item.unitPrice)
        })),
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString()
      };

      // Submit to API
      const response = await fetch("/api/finance/payable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bill");
      }

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Bill has been created successfully",
      });

      // Redirect to the bill detail page
      router.push(`/finance/payable/${data.bill.id}`);
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bill",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={() => router.push("/finance/payable")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Accounts Payable
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Create New Bill</CardTitle>
              <CardDescription>
                Enter bill details to create a new accounts payable entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingVendors}
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
                          {vendors.length === 0 && !isLoadingVendors && (
                            <SelectItem value="none" disabled>
                              No vendors found
                            </SelectItem>
                          )}
                          {isLoadingVendors && (
                            <SelectItem value="loading" disabled>
                              Loading vendors...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Bill description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Issue Date</FormLabel>
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
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
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes or payment instructions" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label>Bill Items</Label>
                <div className="space-y-4 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-3 items-start">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="col-span-5">
                            <FormControl>
                              <Input placeholder="Item description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Qty" 
                                min="0.01" 
                                step="0.01" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Price" 
                                min="0.01" 
                                step="0.01" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-2">
                        <Input 
                          type="text" 
                          value={`$${
                            calculateItemAmount(
                              parseFloat(form.watch(`items.${index}.quantity`) || "0"), 
                              parseFloat(form.watch(`items.${index}.unitPrice`) || "0")
                            ).toFixed(2)
                          }`} 
                          disabled 
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-center h-10">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (fields.length > 1) {
                              remove(index);
                            } else {
                              toast({
                                title: "Cannot remove",
                                description: "At least one item is required",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between py-2 font-medium">
                    <span>Total Amount:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/finance/payable")}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Bill
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 