"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";

// Define interface for the order
interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  status: string;
  produk?: string;
  press_bagus?: string;
  press_reject?: string;
  cutting_id?: string;
  cutting_mesin?: string;
}

interface CuttingDoneFormProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Define the form schema
const formSchema = z.object({
  cutting_bagus: z.string().min(1, "Good quantity is required"),
  cutting_reject: z.string().min(1, "Reject quantity is required"),
  cutting_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function CuttingDoneForm({ order, isOpen, onClose, onSuccess }: CuttingDoneFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cutting_bagus: "",
      cutting_reject: "",
      cutting_notes: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    console.log("Completing cutting for order:", order);
    console.log("Form data:", data);
    
    try {
      // Prepare data for the API call
      const cuttingDoneData = {
        ...data,
        status: "CUTTING DONE", // Update the status to CUTTING DONE
        tgl_cutting_selesai: new Date().toISOString(),
      };
      
      console.log("Submitting cutting completion data:", cuttingDoneData);
      
      // Call API to update the order
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuttingDoneData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating order: ${response.status}`);
      }
      
      // Handle successful response
      const result = await response.json();
      console.log("API Response:", result);
      
      toast({
        title: "Success",
        description: "Order has been marked as CUTTING DONE",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to complete cutting:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Cutting Process</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">SPK</p>
              <p className="text-base">{order.spk}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Customer</p>
              <p className="text-base">{order.customer?.nama || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Product</p>
              <p className="text-base">{order.produk || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Status</p>
              <p className="text-base">{order.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Operator</p>
              <p className="text-base">{order.cutting_id || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Machine</p>
              <p className="text-base">{order.cutting_mesin || "N/A"}</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cutting_bagus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Good Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter quantity" />
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
                      <FormLabel>Reject Quantity</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="Enter quantity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="cutting_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Add any relevant notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Complete Cutting"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 