"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { DialogModal } from "@/components/ui/dialog-modal"

// Form schema
const requestInkSchema = z.object({
  ink_type: z.string().min(1, { message: "Ink type is required" }),
  color: z.string().min(1, { message: "Color is required" }),
  quantity: z.string().min(1, { message: "Quantity is required" }),
  unit: z.string().min(1, { message: "Unit is required" }),
  user_notes: z.string().optional(),
});

type RequestInkFormValues = z.infer<typeof requestInkSchema>;

type RequestInkFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RequestInkFormValues) => Promise<void>;
};

// Define interface for ink stock data
interface InkStockOption {
  id: string;
  type: string;
  color: string;
  quantity: number;
  unit: string;
}

export function RequestInkForm({ open, onOpenChange, onSubmit }: RequestInkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inkStocks, setInkStocks] = useState<InkStockOption[]>([]);
  
  // Derived state for dropdowns
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableQuantities, setAvailableQuantities] = useState<{value: string, unit: string}[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  
  // Initialize form
  const form = useForm<RequestInkFormValues>({
    resolver: zodResolver(requestInkSchema),
    defaultValues: {
      ink_type: "",
      color: "",
      quantity: "",
      unit: "",
      user_notes: "",
    },
  });

  // Watch form values for dependencies
  const watchInkType = form.watch("ink_type");
  const watchInkColor = form.watch("color");
  const watchQuantity = form.watch("quantity");

  // Fetch ink stocks when form opens
  useEffect(() => {
    if (open) {
      fetchInkStocks();
    }
  }, [open]);

  // Update available colors when ink type changes
  useEffect(() => {
    if (watchInkType) {
      // Filter colors by selected ink type
      const filteredColors = [...new Set(
        inkStocks
          .filter(stock => stock.type === watchInkType)
          .map(stock => stock.color)
      )];
      
      setAvailableColors(filteredColors);
      
      // Reset color and quantity selections since type changed
      if (form.getValues("color")) {
        form.setValue("color", "");
        form.setValue("quantity", "");
        form.setValue("unit", "");
      }
    } else {
      setAvailableColors([]);
    }
  }, [watchInkType, inkStocks, form]);

  // Update available quantities when color changes
  useEffect(() => {
    if (watchInkType && watchInkColor) {
      // Filter quantities by selected ink type and color
      const filteredStocks = inkStocks
        .filter(stock => 
          stock.type === watchInkType && 
          stock.color === watchInkColor
        );
      
      // Create a Map to deduplicate quantities while preserving their units
      const quantityMap = new Map();
      
      filteredStocks.forEach(stock => {
        const key = `${stock.quantity}-${stock.unit}`;
        if (!quantityMap.has(key)) {
          quantityMap.set(key, {
            value: stock.quantity.toString(),
            unit: stock.unit
          });
        }
      });
      
      // Convert Map to array of quantity objects
      const quantities = Array.from(quantityMap.values());
      
      setAvailableQuantities(quantities);
      
      // Reset quantity selection since color changed
      if (form.getValues("quantity")) {
        form.setValue("quantity", "");
        form.setValue("unit", "");
      }
    } else {
      setAvailableQuantities([]);
    }
  }, [watchInkType, watchInkColor, inkStocks, form]);

  // Update unit when quantity changes
  useEffect(() => {
    if (watchQuantity) {
      const selectedStock = availableQuantities.find(q => q.value === watchQuantity);
      if (selectedStock) {
        setSelectedUnit(selectedStock.unit);
        form.setValue("unit", selectedStock.unit);
      }
    }
  }, [watchQuantity, availableQuantities, form]);

  // Fetch available ink stocks from API
  const fetchInkStocks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/inventory/ink-stock?availability=YES');
      
      if (!response.ok) {
        throw new Error('Failed to fetch ink stocks');
      }
      
      const data = await response.json() as InkStockOption[];
      setInkStocks(data);
      
      // Extract unique ink types
      const types = [...new Set(data.map(stock => stock.type))];
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error fetching ink stocks:', error);
      toast.error('Failed to load available ink options');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: RequestInkFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit ink request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form on close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setAvailableColors([]);
      setAvailableQuantities([]);
    }
    onOpenChange(open);
  };

  return (
    <DialogModal 
      open={open} 
      onOpenChange={handleOpenChange}
      title="Request Ink"
      description="Submit a request for ink from inventory. Requests will need to be approved."
      maxWidth="md"
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading ink options...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ink_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ink Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ink type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!watchInkType || availableColors.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !watchInkType ? "Select ink type first" : 
                          availableColors.length === 0 ? "No colors available" : 
                          "Select ink color"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableColors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!watchInkColor || availableQuantities.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchInkType ? "Select ink type first" : 
                            !watchInkColor ? "Select color first" : 
                            availableQuantities.length === 0 ? "No quantities available" : 
                            "Select quantity"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableQuantities.map((option, index) => (
                          <SelectItem key={`${option.value}-${index}`} value={option.value}>
                            {option.value} {option.unit}
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Unit will auto-fill"
                        value={field.value}
                        disabled={true}
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="user_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional information or requirements"
                      className="resize-none"
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
      )}
    </DialogModal>
  );
} 