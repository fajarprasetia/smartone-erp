"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { Skeleton } from "@/components/ui/skeleton";

// Types
type Vendor = {
  id: string;
  name: string;
  email: string;
};

type BillItem = {
  id: string;
  tempId: string; // Used for UI identification
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Bill = {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  description: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "draft" | "pending" | "paid" | "partially_paid" | "overdue";
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
};

// Define schema for bill editing
const billSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  description: z.string().min(1, "Description is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(
    z.object({
      description: z.string().min(1, "Item description is required"),
      quantity: z.number().positive("Quantity must be positive"),
      unitPrice: z.number().nonnegative("Unit price must be non-negative"),
      amount: z.number().nonnegative("Amount must be non-negative"),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().optional(),
});

export default function EditBillPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<BillItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [issueDateOpen, setIssueDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchingVendors, setFetchingVendors] = useState(true);
  const [fetchingBill, setFetchingBill] = useState(true);
  const [billData, setBillData] = useState<Bill | null>(null);
  const [billNumber, setBillNumber] = useState<string>("");
  const [originalStatus, setOriginalStatus] = useState<string>("");

  // Load bill data and vendors on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingBill(true);
        // Fetch bill data
        const billResponse = await fetch(`/api/finance/payable?id=${params.id}`);
        if (!billResponse.ok) {
          throw new Error("Failed to fetch bill");
        }
        const billResult = await billResponse.json();
        if (billResult.bills && billResult.bills.length > 0) {
          const bill = billResult.bills[0];
          setBillData(bill);
          setSelectedVendor(bill.vendorId);
          setDescription(bill.description);
          setIssueDate(parseISO(bill.issueDate));
          setDueDate(parseISO(bill.dueDate));
          setNotes(bill.notes || "");
          setBillNumber(bill.billNumber);
          setOriginalStatus(bill.status);
          
          // Transform bill items for the UI
          const transformedItems = bill.items.map(item => ({
            ...item,
            tempId: uuidv4() // Add tempId for UI operations
          }));
          setItems(transformedItems);
        } else {
          toast({
            title: "Error",
            description: "Bill not found",
            variant: "destructive",
          });
          router.push("/finance/payable");
        }
        
        // Fetch vendors
        setFetchingVendors(true);
        const vendorsResponse = await fetch("/api/vendors");
        if (!vendorsResponse.ok) {
          throw new Error("Failed to fetch vendors");
        }
        const vendorsData = await vendorsResponse.json();
        setVendors(vendorsData.vendors || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setFetchingBill(false);
        setFetchingVendors(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Add a new item to the bill
  const addItem = () => {
    const newItem: BillItem = {
      id: "", // Will be assigned by the server for new items
      tempId: uuidv4(), // Temporary ID for UI
      description: "",
      quantity: 1,
      unitPrice: 0,
      amount: 0,
    };
    setItems([...items, newItem]);
  };

  // Remove an item from the bill
  const removeItem = (tempId: string) => {
    setItems(items.filter(item => item.tempId !== tempId));
  };

  // Update an item's property
  const updateItem = (tempId: string, field: keyof BillItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate amount if quantity or unitPrice changed
        if (field === "quantity" || field === "unitPrice") {
          const quantity = field === "quantity" ? Number(value) : item.quantity;
          const unitPrice = field === "unitPrice" ? Number(value) : item.unitPrice;
          updatedItem.amount = quantity * unitPrice;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculate total amount
  const calculateTotal = () => {
    return items.reduce((total, item) => total + item.amount, 0);
  };

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedVendor) {
      newErrors.vendorId = "Vendor is required";
    }

    if (!description) {
      newErrors.description = "Description is required";
    }

    if (!issueDate) {
      newErrors.issueDate = "Issue date is required";
    }

    if (!dueDate) {
      newErrors.dueDate = "Due date is required";
    } else if (issueDate && dueDate < issueDate) {
      newErrors.dueDate = "Due date must be after issue date";
    }

    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      items.forEach((item, index) => {
        if (!item.description) {
          newErrors[`item-${index}-description`] = "Description is required";
        }
        if (item.quantity <= 0) {
          newErrors[`item-${index}-quantity`] = "Quantity must be positive";
        }
        if (item.unitPrice < 0) {
          newErrors[`item-${index}-unitPrice`] = "Unit price must be non-negative";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Check if bill is already paid or partially paid - can't edit in those states
      if (originalStatus === "paid" || originalStatus === "partially_paid") {
        toast({
          title: "Cannot Edit",
          description: "Paid or partially paid bills cannot be edited",
          variant: "destructive",
        });
        return;
      }

      // Prepare the bill data
      const updatedBillData = {
        id: params.id,
        vendorId: selectedVendor,
        description,
        issueDate,
        dueDate,
        items: items.map(item => ({
          id: item.id, // Keep original ID for existing items
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        notes,
      };

      // Send the bill data to the API
      const response = await fetch(`/api/finance/payable/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedBillData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bill");
      }

      // Show success toast
      toast({
        title: "Bill Updated",
        description: `Bill #${billNumber} has been updated successfully`,
      });

      // Redirect to the bill details page
      router.push(`/finance/payable/${params.id}`);
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update bill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (fetchingBill) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show error if bill data not found
  if (!billData) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h3 className="text-xl font-semibold mb-2">Bill Not Found</h3>
        <p className="text-muted-foreground mb-6">The requested bill could not be found or may have been deleted.</p>
        <Button onClick={() => router.push("/finance/payable")}>
          Return to Accounts Payable
        </Button>
      </div>
    );
  }

  // Show warning for paid or partially paid bills
  if (originalStatus === "paid" || originalStatus === "partially_paid") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Bill #{billNumber}</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertCircle className="h-16 w-16 text-yellow-500 mb-6" />
          <h3 className="text-xl font-semibold mb-2">Cannot Edit This Bill</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            This bill has already been {originalStatus === "paid" ? "fully paid" : "partially paid"} and cannot be edited.
            You can view the bill details instead.
          </p>
          <Button onClick={() => router.push(`/finance/payable/${params.id}`)}>
            View Bill Details
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Bill #{billNumber}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
              <CardDescription>Update the information for this bill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor <span className="text-destructive">*</span></Label>
                <select
                  id="vendor"
                  className={`flex h-10 w-full rounded-md border ${errors.vendorId ? 'border-destructive' : 'border-input'} bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  disabled={fetchingVendors}
                >
                  <option value="">Select a vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
                {errors.vendorId && (
                  <p className="text-sm text-destructive">{errors.vendorId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
                <Input
                  id="description"
                  placeholder="Invoice for services"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date <span className="text-destructive">*</span></Label>
                  <Popover open={issueDateOpen} onOpenChange={setIssueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${errors.issueDate ? 'border-destructive' : ''}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {issueDate ? format(issueDate, "PP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={issueDate}
                        onSelect={(date) => {
                          setIssueDate(date);
                          setIssueDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.issueDate && (
                    <p className="text-sm text-destructive">{errors.issueDate}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
                  <Popover open={dueDateOpen} onOpenChange={setDueDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${errors.dueDate ? 'border-destructive' : ''}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          setDueDate(date);
                          setDueDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.dueDate && (
                    <p className="text-sm text-destructive">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this bill"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bill Items</CardTitle>
                <CardDescription>Update items or services included in this bill</CardDescription>
              </div>
              <Button size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {errors.items && (
                <div className="mb-4 p-4 bg-destructive/10 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{errors.items}</p>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50%]">Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No items added. Click "Add Item" to add a bill item.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item, index) => (
                        <TableRow key={item.tempId}>
                          <TableCell>
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateItem(item.tempId, "description", e.target.value)}
                              className={errors[`item-${index}-description`] ? 'border-destructive' : ''}
                            />
                            {errors[`item-${index}-description`] && (
                              <p className="text-xs text-destructive mt-1">
                                {errors[`item-${index}-description`]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.tempId, "quantity", Number(e.target.value))}
                              className={`w-20 ml-auto ${errors[`item-${index}-quantity`] ? 'border-destructive' : ''}`}
                            />
                            {errors[`item-${index}-quantity`] && (
                              <p className="text-xs text-destructive mt-1">
                                {errors[`item-${index}-quantity`]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.tempId, "unitPrice", Number(e.target.value))}
                              className={`w-28 ml-auto ${errors[`item-${index}-unitPrice`] ? 'border-destructive' : ''}`}
                            />
                            {errors[`item-${index}-unitPrice`] && (
                              <p className="text-xs text-destructive mt-1">
                                {errors[`item-${index}-unitPrice`]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.tempId)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {items.length > 0 && (
                <div className="flex justify-end mt-4">
                  <div className="w-[250px] space-y-2">
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">{formatCurrency(calculateTotal())}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
              <CardDescription>Review your changes before saving</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Vendor</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedVendor 
                    ? vendors.find(v => v.id === selectedVendor)?.name || "Selected vendor" 
                    : "No vendor selected"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {description || "No description provided"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Issue Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {issueDate ? format(issueDate, "MMM dd, yyyy") : "Not set"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Due Date</h3>
                  <p className="text-sm text-muted-foreground">
                    {dueDate ? format(dueDate, "MMM dd, yyyy") : "Not set"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Items</h3>
                <p className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Total Amount</h3>
                <p className="text-lg font-bold">{formatCurrency(calculateTotal())}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Bill Status</h3>
                <p className="text-sm">
                  <span className={`inline-flex h-6 items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold 
                    ${originalStatus === "draft" ? "bg-secondary text-secondary-foreground" : 
                     originalStatus === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" : 
                     originalStatus === "overdue" ? "bg-destructive text-destructive-foreground" : ""}`}
                  >
                    {originalStatus.replace("_", " ").toUpperCase()}
                  </span>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? "Saving Changes..." : "Save Changes"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push(`/finance/payable/${params.id}`)}
                disabled={loading}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
} 