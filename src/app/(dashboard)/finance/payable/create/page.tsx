"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, AlertCircle, Calendar } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

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

// Define schema for bill creation
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

export default function CreateBillPage() {
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

  // Load vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setFetchingVendors(true);
        const response = await fetch("/api/vendors");
        if (!response.ok) {
          throw new Error("Failed to fetch vendors");
        }
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
        setFetchingVendors(false);
      }
    };

    fetchVendors();
  }, []);

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
      id: "", // Will be assigned by the server
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

      // Prepare the bill data
      const billData = {
        vendorId: selectedVendor,
        description,
        issueDate,
        dueDate,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
        notes,
      };

      // Send the bill data to the API
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

      // Get the created bill data
      const result = await response.json();

      // Show success toast
      toast({
        title: "Bill Created",
        description: `Bill #${result.billNumber} has been created successfully`,
      });

      // Redirect to the bill details page
      router.push(`/finance/payable/${result.id}`);
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create bill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create New Bill</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
              <CardDescription>Enter the basic information for this bill</CardDescription>
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
                <CardDescription>Add items or services included in this bill</CardDescription>
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
              <CardDescription>Review your bill before submission</CardDescription>
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
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={handleSubmit} 
                disabled={loading}
              >
                {loading ? "Creating Bill..." : "Create Bill"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.back()}
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