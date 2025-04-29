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
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  notes: z.string().optional(),
  cutting_mesin: z.string().min(1, "Cutting machine is required"),
  cutting_speed: z.string().min(1, "Cutting speed is required"),
  acc: z.string().optional(),
  power: z.string().optional(),
  cutting_bagus: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CuttingStartFormProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CuttingStartForm({
  order,
  open,
  onOpenChange,
  onSuccess,
}: CuttingStartFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
      cutting_mesin: "",
      cutting_speed: "",
      acc: "",
      power: "",
      cutting_bagus: "0",
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!order || !session?.user?.id) {
      toast.error("Missing required information");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/production/orders/start-cutting`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Add order ID to the payload
          id: order.id,
          
          // Required values for status change
          cutting_id: session.user.id,
          status: "CUTTING",
          tgl_cutting: new Date().toISOString(),
          
          // Form values mapped to database fields
          catatan_cutting: values.notes,
          cutting_mesin: values.cutting_mesin,
          cutting_speed: values.cutting_speed,
          acc: values.acc,
          power: values.power,
          cutting_bagus: values.cutting_bagus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start cutting process");
      }

      toast.success("Cutting process has been started");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error starting cutting process:", error);
      toast.error("Failed to start cutting process");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cutting_mesin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cutting Machine*</FormLabel>
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
                      <FormLabel>Cutting Speed*</FormLabel>
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add notes about the cutting process (optional)"
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
                  {isSubmitting ? "Processing..." : "Start Cutting"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}
    </>
  );
} 