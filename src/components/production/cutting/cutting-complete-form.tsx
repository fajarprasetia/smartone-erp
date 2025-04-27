"use client";

import { useState, useEffect } from "react";
import { Order } from "@/types/order";
import { toast } from "sonner";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  FormDescription
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

// Add safeStringify helper function
// Safely stringify values including BigInt
function safeStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  );
}

// Define the schema
const formSchema = z.object({
  cutting_bagus: z.string().min(1, "Good cuts is required"),
  cutting_reject: z.string().min(1, "Rejected cuts is required"),
  catatan_cutting: z.string().optional(),
  cutting_mesin: z.string().min(1, "Machine is required"),
  cutting_speed: z.string().min(1, "Speed is required"),
  acc: z.string().min(1, "Acceleration is required"),
  power: z.string().min(1, "Power is required"),
});

// Infer the type
type FormValues = z.infer<typeof formSchema>;

interface CuttingCompleteFormProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CuttingCompleteForm({
  order,
  open,
  onOpenChange,
  onSuccess,
}: CuttingCompleteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Helper function to get initial data from order
  const getInitialData = () => {
    if (!order) {
      return {
        cutting_bagus: "",
        cutting_reject: "",
        catatan_cutting: "",
        cutting_mesin: "",
        cutting_speed: "",
        acc: "",
        power: "",
      };
    }
    
    // Get data from order with fallbacks for each field
    const initialData = {
      cutting_bagus: order.cutting_bagus || "",
      cutting_reject: (order as any).cutting_reject || "",
      catatan_cutting: order.catatan_cutting || "",
      cutting_mesin: order.cutting_mesin || "",
      cutting_speed: order.cutting_speed || "",
      acc: order.acc || "",
      power: order.power || "",
    };
    
    console.log("Setting initial form data:", initialData);
    return initialData;
  };

  // Initialize form with correct types
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialData(),
  });

  // Update form values when order changes
  useEffect(() => {
    console.log("Order changed, resetting form with new data");
    const initialData = getInitialData();
    form.reset(initialData);
  }, [order, form]);

  // Check if API supports retrieving current data
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order?.id) return;
      
      try {
        // Try to fetch more detailed order data if available - suppress 404 errors
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // Timeout after 2 seconds
        
        try {
          const response = await fetch(`/api/production/orders/${order.id}/cutting-details`, {
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const detailedData = await response.json();
            console.log("Retrieved detailed order data:", detailedData);
            
            // Update form with more detailed data if available
            form.reset({
              ...getInitialData(),
              ...detailedData,
              catatan_cutting: detailedData.catatan_cutting || order.catatan_cutting || "",
            });
          } else {
            // Don't log errors for expected 404s
            console.log("Using default order data for form");
          }
        } catch (error) {
          // Silently handle aborted requests or network errors
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // Catch any other unexpected errors but don't show them in console
      }
    };
    
    fetchOrderDetails();
  }, [order, form]);

  // Update the form submission handler
  const onSubmit = form.handleSubmit(async (values) => {
    if (!order) return;
    
    console.log("Submitting values:", safeStringify(values));
    
    try {
      setIsSubmitting(true);
      
      const submissionData = {
        ...values,
        cutting_done: new Date().toISOString(),
      };
      
      console.log("API request data:", safeStringify(submissionData));
      
      const response = await fetch(`/api/production/orders/${order.id}/complete-cutting`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: safeStringify(submissionData),
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("Success response:", safeStringify(responseData));
        
        toast.success("Cutting completed successfully");
        
        onSuccess && onSuccess();
        onOpenChange && onOpenChange(false);
        router.refresh();
      } else {
        // Handle error response
        let errorMessage: string;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || "Failed to complete cutting process";
          console.error("Error response (JSON):", safeStringify(errorData));
        } catch (parseError) {
          // If parsing JSON fails, get the text response
          const errorText = await response.text();
          errorMessage = `Failed to complete cutting process: ${errorText || response.statusText}`;
          console.error("Error response (Text):", errorText);
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Exception during submission:", error);
      toast.error(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Cutting Process</DialogTitle>
          <DialogDescription>
            {order && `Order: ${order.spk} - ${order.customerName}`}
          </DialogDescription>
        </DialogHeader>

        {order && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm font-medium">SPK</p>
                <p className="text-sm">{order.spk}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Customer</p>
                <p className="text-sm">{order.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Product</p>
                <p className="text-sm">{order.productName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Quantity</p>
                <p className="text-sm">{order.quantity} {order.unit}</p>
              </div>
              {order.cuttingStartedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Started</p>
                  <p className="text-sm">
                    {new Date(order.cuttingStartedAt).toLocaleString()}
                  </p>
                </div>
              )}
              {order.cuttingAssignee && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Assignee</p>
                  <p className="text-sm">{order.cuttingAssignee}</p>
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Machine and Speed Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cutting_mesin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cutting Machine</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Machine name/model"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cutting_speed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cutting Speed</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Speed setting"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Acceleration and Power Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="acc"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acceleration</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Acceleration setting"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="power"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Power setting"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Production Results */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cutting_bagus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Good Cutting</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Number of good pieces"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cutting_reject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rejected Cutting</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Number of rejected pieces"
                            className="bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="catatan_cutting"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add notes about the cutting results (optional)"
                          className="resize-none bg-background/50"
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
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Complete Cutting"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 