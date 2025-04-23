"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

// Form schema for completing DTF process
const dtfCompleteSchema = z.object({
  quantity_completed: z.string().min(1, { message: "Completed quantity is required" }),
  completion_date: z.date(),
  quality_check: z.string().min(1, { message: "Quality check result is required" }),
  notes: z.string().optional(),
});

type DTFCompleteFormValues = z.infer<typeof dtfCompleteSchema>;

interface Order {
  id: string;
  spk: string;
  customer: { nama: string };
  produk: string;
}

interface DTFCompleteFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DTFCompleteForm({ order, open, onOpenChange, onSuccess }: DTFCompleteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<DTFCompleteFormValues>({
    resolver: zodResolver(dtfCompleteSchema),
    defaultValues: {
      quantity_completed: "",
      completion_date: new Date(),
      quality_check: "PASS",
      notes: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: DTFCompleteFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/complete-dtf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          ...data,
          completion_date: data.completion_date.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete DTF process");
      }

      toast.success("DTF process completed successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error completing DTF process:", error);
      toast.error("Failed to complete DTF process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete DTF Process</DialogTitle>
          <DialogDescription>
            Order: {order.spk} - {order.customer.nama}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1 mb-4">
              <h3 className="font-medium">Order Details</h3>
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 text-sm">
                <div>
                  <p className="text-muted-foreground">SPK</p>
                  <p className="font-medium">{order.spk}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{order.customer.nama}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">{order.produk}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="quantity_completed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity Completed*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      min="1"
                      placeholder="Enter completed quantity" 
                      className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="completion_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Completion Date*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-background/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => field.onChange(date || new Date())}
                        initialFocus
                        className="z-[9999]"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quality_check"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quality Check*</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select quality check result" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASS">Pass</SelectItem>
                        <SelectItem value="PARTIAL">Partial Pass</SelectItem>
                        <SelectItem value="FAIL">Fail</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any quality issues or additional notes"
                      className="resize-none bg-background/50"
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
                {isSubmitting ? "Completing..." : "Complete DTF Process"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 