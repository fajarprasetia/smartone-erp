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
import { Textarea } from "@/components/ui/textarea";
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

const requestInkSchema = z.object({
  warna: z.string().min(1, "Color is required"),
  jumlah: z.string().min(1, "Quantity is required"),
  catatan: z.string().optional(),
});

type RequestInkFormValues = z.infer<typeof requestInkSchema>;

interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  nama_pesanan?: string;
  status: string;
}

interface RequestInkFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestInkForm({ order, open, onOpenChange, onSuccess }: RequestInkFormProps) {
  const [submitting, setSubmitting] = useState<boolean>(false);

  const form = useForm<RequestInkFormValues>({
    resolver: zodResolver(requestInkSchema),
    defaultValues: {
      warna: "",
      jumlah: "",
      catatan: "",
    },
  });

  async function onSubmit(values: RequestInkFormValues) {
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/orders/${order.id}/request/tinta`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit ink request");
      }

      onSuccess();
      onOpenChange(false);
      toast.success("Ink request has been submitted successfully");
    } catch (error) {
      console.error("Error submitting ink request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit ink request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Ink</DialogTitle>
          <DialogDescription>
            Submit ink request for order #{order.spk}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="warna"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter color/shade"
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
              name="jumlah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter quantity needed"
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
              name="catatan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about the ink request"
                      className="bg-background/50 resize-none"
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
                  'Submit Request'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 