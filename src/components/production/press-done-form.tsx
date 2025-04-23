"use client";

import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

// Simple spinner component
const Spinner = ({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8"
  };
  
  return <Loader2 className={`animate-spin ${sizeClasses[size]} ${className || ""}`} />;
};

// Form schema
const pressDoneFormSchema = z.object({
  press_bagus: z.string().min(1, "Number of good items is required"),
  press_reject: z.string().min(1, "Number of rejected items is required"),
  press_waste: z.string().optional(),
  catatan_press: z.string().optional(),
});

type PressDoneFormValues = z.infer<typeof pressDoneFormSchema>;

interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  nama_pesanan?: string;
  status: string;
  prints_qty?: string;
  produk?: string;
}

interface PressDoneFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PressDoneForm({ 
  order, 
  open, 
  onOpenChange, 
  onSuccess 
}: PressDoneFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();

  // Calculate total quantity from prints_qty if available
  const totalQty = order.prints_qty ? parseInt(order.prints_qty) : 0;

  const form = useForm<PressDoneFormValues>({
    resolver: zodResolver(pressDoneFormSchema),
    defaultValues: {
      press_bagus: "",
      press_reject: "",
      press_waste: "",
      catatan_press: "",
    },
  });

  // Watch values to provide real-time feedback
  const goodCount = form.watch("press_bagus");
  const rejectCount = form.watch("press_reject");
  const wasteCount = form.watch("press_waste");
  
  // Calculate total and difference
  const currentGood = goodCount ? parseInt(goodCount) : 0;
  const currentReject = rejectCount ? parseInt(rejectCount) : 0;
  const currentWaste = wasteCount ? parseInt(wasteCount) : 0;
  const currentTotal = currentGood + currentReject + currentWaste;
  const difference = totalQty - currentTotal;

  async function onSubmit(values: PressDoneFormValues) {
    setSubmitting(true);
    try {
      // Check if this is a PRESS ONLY order
      const isPressOnly = order.produk === "PRESS ONLY";
      
      console.log("Processing press done for order:", order.spk);
      console.log("Order product type:", order.produk);
      console.log("Is PRESS ONLY:", isPressOnly);
      
      const response = await fetch(`/api/orders/${order.id}/production/press-done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          press_done: new Date().toISOString(), // Add current timestamp
          // For PRESS ONLY orders, also set the statusm to JOB DONE
          statusm: isPressOnly ? "JOB DONE" : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete press job");
      }

      onSuccess();
      onOpenChange(false);
      toast({
        title: "Success",
        description: isPressOnly 
          ? "Press job completed and marked as JOB DONE" 
          : "Press job has been marked as completed",
      });
    } catch (error) {
      console.error("Error submitting press-done form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete press job",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Complete Press Job</DialogTitle>
          <DialogDescription>
            Mark press job for order #{order.spk} as completed
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="press_bagus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Good Items (ACC)*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter number of good items"
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
                name="press_reject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejected Items*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter rejected items"
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
                name="press_waste"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Waste</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter waste"
                        className="bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {totalQty > 0 && (
              <div className="grid grid-cols-3 gap-2 p-2 bg-muted rounded-md text-sm">
                <div>
                  <span className="font-semibold">Expected:</span> {totalQty}
                </div>
                <div>
                  <span className="font-semibold">Actual:</span> {currentTotal}
                </div>
                <div className={difference !== 0 ? "text-red-500" : "text-green-500"}>
                  <span className="font-semibold">Difference:</span> {difference}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="catatan_press"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any notes about the press job"
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
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    Processing...
                  </>
                ) : (
                  'Complete Press Job'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}