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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
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

const transferSchema = z.object({
  destination: z.string().min(1, "Destination is required"),
  quantity: z.string().min(1, "Quantity is required"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  nama_pesanan?: string;
  status: string;
}

interface TransferFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferForm({ order, open, onOpenChange, onSuccess }: TransferFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      destination: "",
      quantity: "",
    },
  });

  async function onSubmit(values: TransferFormValues) {
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit transfer");
      }

      onSuccess();
      onOpenChange(false);
      toast.success("Transfer has been submitted successfully");
    } catch (error) {
      console.error("Error submitting transfer:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit transfer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Order</DialogTitle>
          <DialogDescription>
            Submit transfer for order #{order.spk}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter destination"
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter quantity"
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner className="mr-2" size="sm" />
                    Processing...
                  </>
                ) : (
                  'Submit Transfer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 