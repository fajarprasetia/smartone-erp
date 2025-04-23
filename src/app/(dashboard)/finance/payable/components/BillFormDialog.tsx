"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { format } from "date-fns";
import { X, Plus, CalendarIcon, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatCurrency } from "@/lib/utils";
import { Bill } from "./PayableTable";

// Schema for bill items
const billItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .positive("Quantity must be greater than 0"),
  unitPrice: z.coerce
    .number({
      required_error: "Unit price is required",
      invalid_type_error: "Unit price must be a number",
    })
    .positive("Unit price must be greater than 0"),
  accountId: z.number({
    required_error: "Account is required",
  }),
  taxRate: z.coerce
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100%")
    .default(0),
});

// Schema for bill
const billFormSchema = z.object({
  vendorId: z.number({
    required_error: "Vendor is required",
  }),
  billDate: z.date({
    required_error: "Bill date is required",
  }),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  billNumber: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(billItemSchema).min(1, "At least one item is required"),
  attachments: z.array(
    z.object({
      file: z.instanceof(File),
      name: z.string(),
    })
  ).optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  bill?: Bill;
  onSuccess?: () => void;
  onSubmit?: (data: any) => void;
}

export function BillFormDialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  bill,
  onSuccess,
  onSubmit: externalSubmit,
}: BillFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  
  // Handle both open patterns (open/onOpenChange and isOpen/onClose)
  const dialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!value && onClose) onClose();
  };

  // Initialize form with default values or bill data for editing
  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      vendorId: bill?.vendorId || 0,
      billDate: bill?.billDate ? new Date(bill.billDate) : new Date(),
      dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
      billNumber: bill?.billNumber || "",
      reference: bill?.reference || "",
      notes: bill?.notes || "",
      items: bill?.items || [
        {
          description: "",
          quantity: 1,
          unitPrice: 0,
          accountId: 0,
          taxRate: 0,
        },
      ],
      attachments: [],
    },
  });

  // Field array for managing bill items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form when bill changes
  useEffect(() => {
    if (dialogOpen) {
      if (bill) {
        // Editing existing bill
        form.reset({
          vendorId: bill.vendorId,
          billDate: bill.billDate ? new Date(bill.billDate) : new Date(),
          dueDate: bill.dueDate ? new Date(bill.dueDate) : new Date(),
          billNumber: bill.billNumber || "",
          reference: bill.reference || "",
          notes: bill.notes || "",
          items: bill.items?.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            accountId: item.accountId,
            taxRate: item.taxRate || 0,
          })) || [
            {
              description: "",
              quantity: 1,
              unitPrice: 0,
              accountId: 0,
              taxRate: 0,
            },
          ],
          attachments: [],
        });
      } else {
        // Creating new bill
        form.reset({
          vendorId: 0,
          billDate: new Date(),
          dueDate: new Date(),
          billNumber: "",
          reference: "",
          notes: "",
          items: [
            {
              description: "",
              quantity: 1,
              unitPrice: 0,
              accountId: 0,
              taxRate: 0,
            },
          ],
          attachments: [],
        });
      }

      // Fetch vendors and accounts when dialog opens
      fetchVendors();
      fetchAccounts();
    }
  }, [dialogOpen, bill, form]);

  // Fetch vendors from API
  async function fetchVendors() {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }
      const data = await response.json();
      setVendors(data.vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors. Please try again.");
    }
  }

  // Fetch accounts from API
  async function fetchAccounts() {
    try {
      const response = await fetch("/api/finance/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts. Please try again.");
    }
  }

  // Calculate subtotal for items
  const calculateSubtotal = (items: any[]) => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };

  // Calculate tax for items
  const calculateTax = (items: any[]) => {
    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const taxRate = Number(item.taxRate) || 0;
      return sum + (quantity * unitPrice * taxRate) / 100;
    }, 0);
  };

  // Calculate total for items
  const calculateTotal = (items: any[]) => {
    return calculateSubtotal(items) + calculateTax(items);
  };

  // Add a new item to the bill
  const addItem = () => {
    append({
      description: "",
      quantity: 1,
      unitPrice: 0,
      accountId: 0,
      taxRate: 0,
    });
  };

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).map(file => ({
        file,
        name: file.name,
      }));
      
      const currentAttachments = form.getValues("attachments") || [];
      form.setValue("attachments", [...currentAttachments, ...filesArray]);
    }
  };

  // Remove an attachment
  const removeAttachment = (index: number) => {
    const attachments = form.getValues("attachments") || [];
    form.setValue(
      "attachments",
      attachments.filter((_, i) => i !== index)
    );
  };

  // Handle form submission
  async function onSubmit(data: BillFormValues) {
    setIsSubmitting(true);
    
    try {
      // If external submit handler is provided, use it
      if (externalSubmit) {
        await externalSubmit(data);
        handleOpenChange(false);
        return;
      }
      
      // Calculate totals
      const subtotal = calculateSubtotal(data.items);
      const tax = calculateTax(data.items);
      const total = calculateTotal(data.items);
      
      // Format data for API
      const billData = {
        ...data,
        id: bill?.id, // Include ID if editing
        totalAmount: total,
        billDate: format(data.billDate, "yyyy-MM-dd"),
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
      };
      
      // Send data to API
      const url = bill ? `/api/finance/payable/${bill.id}` : "/api/finance/payable";
      const method = bill ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save bill");
      }
      
      // Upload attachments if any
      if (data.attachments && data.attachments.length > 0) {
        const responseData = await response.json();
        const billId = responseData.id || bill?.id;
        
        for (const attachment of data.attachments) {
          const formData = new FormData();
          formData.append("file", attachment.file);
          formData.append("billId", billId.toString());
          
          const attachmentResponse = await fetch("/api/finance/payable/attachment", {
            method: "POST",
            body: formData,
          });
          
          if (!attachmentResponse.ok) {
            console.error("Failed to upload attachment:", attachment.name);
          }
        }
      }
      
      toast.success(bill ? "Bill updated successfully" : "Bill created successfully");
      handleOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error saving bill:", error);
      toast.error(
        typeof error === "object" && error !== null && "message" in error 
          ? (error as Error).message 
          : "Failed to save bill. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Watch the items field to update totals
  const watchedItems = form.watch("items");
  const subtotal = calculateSubtotal(watchedItems);
  const tax = calculateTax(watchedItems);
  const total = calculateTotal(watchedItems);

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Bill" : "Create New Bill"}</DialogTitle>
          <DialogDescription>
            {bill
              ? "Update the details for this bill"
              : "Enter vendor and bill details to create a new bill"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor*</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.id}
                            value={vendor.id.toString()}
                          >
                            {vendor.name}
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
                name="billNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bill/Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bill number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Bill Date*</FormLabel>
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
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
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
                    <FormLabel>Due Date*</FormLabel>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
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
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="PO number, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Bill Items*</h3>
              <div className="border rounded-md p-4 space-y-4">
                <div className="grid grid-cols-12 gap-2 font-medium text-sm">
                  <div className="col-span-4">Description</div>
                  <div className="col-span-1">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">Account</div>
                  <div className="col-span-1">Tax %</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-1"></div>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                placeholder="Description"
                                {...field}
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                {...field}
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <Select
                              onValueChange={(value) =>
                                field.onChange(Number(value))
                              }
                              defaultValue={
                                field.value ? field.value.toString() : undefined
                              }
                            >
                              <FormControl>
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id.toString()}
                                  >
                                    {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1">
                      <FormField
                        control={form.control}
                        name={`items.${index}.taxRate`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="0"
                                {...field}
                                className="h-9"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      {formatCurrency(
                        (form.getValues(`items.${index}.quantity`) || 0) *
                          (form.getValues(`items.${index}.unitPrice`) || 0)
                      )}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4" /> Add Item
                </Button>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-right font-medium">Subtotal:</div>
                  <div className="text-right">{formatCurrency(subtotal)}</div>
                  <div className="text-right font-medium">Tax:</div>
                  <div className="text-right">{formatCurrency(tax)}</div>
                  <div className="text-right font-bold">Total:</div>
                  <div className="text-right font-bold">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes"
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="text-sm font-medium">Attachments</label>
              <div className="mt-2 space-y-2">
                {form.getValues("attachments")?.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <span className="text-sm truncate">{attachment.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-center p-4 border border-dashed rounded-md">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="h-6 w-6 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">
                      Click to upload attachments
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {bill ? "Update Bill" : "Create Bill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 