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

// Form schema for starting DTF process
const dtfStartSchema = z.object({
  operator: z.string().min(1, { message: "Operator is required" }),
  machine: z.string().min(1, { message: "Machine is required" }),
  estimated_completion: z.date(),
  notes: z.string().optional(),
});

type DTFStartFormValues = z.infer<typeof dtfStartSchema>;

interface Order {
  id: string;
  spk: string;
  customer: {
    name: string;
  };
  produk: string;
}

interface DTFStartFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function DTFStartForm({ order, open, onOpenChange, onSuccess }: DTFStartFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<DTFStartFormValues>({
    resolver: zodResolver(dtfStartSchema),
    defaultValues: {
      operator: "",
      machine: "",
      estimated_completion: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow by default
      notes: "",
    },
  });

  // Handle form submission
  const onSubmit = async (data: DTFStartFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/orders/start-dtf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          ...data,
          estimated_completion: data.estimated_completion.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start DTF process");
      }

      toast.success("DTF process started successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error starting DTF process:", error);
      toast.error("Failed to start DTF process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start DTF Process</DialogTitle>
          <DialogDescription>
            Order: {order.spk} - {order.customer.name}
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
                  <p className="font-medium">{order.customer.name}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">{order.produk}</p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator*</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter operator name" 
                      className="bg-background/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine*</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select machine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DTF-1">DTF Machine 1</SelectItem>
                        <SelectItem value="DTF-2">DTF Machine 2</SelectItem>
                        <SelectItem value="DTF-3">DTF Machine 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimated_completion"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Estimated Completion Date*</FormLabel>
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter any specific instructions or notes"
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
                {isSubmitting ? "Starting..." : "Start DTF Process"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 