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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

interface CuttingFormProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Define the form schema
const formSchema = z.object({
  cutting_id: z.string().min(1, "Operator is required"),
  cutting_mesin: z.string().min(1, "Machine is required"),
  cutting_speed: z.string().min(1, "Speed is required"),
  cutting_power: z.string().min(1, "Power is required"),
  cutting_acc: z.string().min(1, "Accuracy is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function CuttingForm({ order, isOpen, onClose, onSuccess }: CuttingFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cutting_id: "",
      cutting_mesin: "",
      cutting_speed: "",
      cutting_power: "",
      cutting_acc: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    
    console.log("Starting cutting for order:", order);
    console.log("Form data:", data);
    
    try {
      // Prepare data for the API call
      const cuttingData = {
        ...data,
        status: "CUTTING", // Update the status to CUTTING
        tgl_cutting: new Date().toISOString(),
      };
      
      console.log("Submitting cutting data:", cuttingData);
      
      // Call API to update the order
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cuttingData),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating order: ${response.status}`);
      }
      
      // Handle successful response
      const result = await response.json();
      console.log("API Response:", result);
      
      toast({
        title: "Success",
        description: "Order has been moved to CUTTING status",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Failed to start cutting:", error);
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
          <DialogTitle>Start Cutting Process</DialogTitle>
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
              <p className="text-sm font-medium mb-1">Good Press</p>
              <p className="text-base">{order.press_bagus || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Press Rejects</p>
              <p className="text-base">{order.press_reject || "N/A"}</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="cutting_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select operator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Operator 1</SelectItem>
                        <SelectItem value="2">Operator 2</SelectItem>
                        <SelectItem value="3">Operator 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cutting_mesin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Machine 1">Machine 1</SelectItem>
                        <SelectItem value="Machine 2">Machine 2</SelectItem>
                        <SelectItem value="Machine 3">Machine 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cutting_speed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Speed</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Speed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cutting_power"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Power" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cutting_acc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accuracy</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Accuracy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
                    "Start Cutting"
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