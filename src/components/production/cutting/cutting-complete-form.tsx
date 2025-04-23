"use client";

import { useState } from "react";
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

// Define the schema
const formSchema = z.object({
  notes: z.string().optional(),
  cutting_bagus: z.string().optional(),
  cutting_reject: z.string().optional(),
  isOrderComplete: z.boolean(),
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with correct types
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      cutting_bagus: "0",
      cutting_reject: "0",
      isOrderComplete: false,
    } as FormValues,
  });

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    if (!order) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/production/orders/${order.id}/complete-cutting`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete cutting process");
      }

      const newStatus = values.isOrderComplete ? "JOB DONE" : "CUTTING DONE";
      toast.success(`Cutting completed. Order status: ${newStatus}`);
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing cutting process:", error);
      toast.error("Failed to complete cutting process");
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  name="notes"
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

                <FormField
                  control={form.control}
                  name="isOrderComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background/50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Mark order as complete</FormLabel>
                        <FormDescription>
                          Check this if the entire order is completed and ready for delivery
                        </FormDescription>
                      </div>
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