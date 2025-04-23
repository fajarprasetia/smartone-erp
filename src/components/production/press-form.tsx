"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
const pressFormSchema = z.object({
  press_mesin: z.string().min(1, "Press machine is required"),
  press_presure: z.string().min(1, "Pressure is required"),
  press_suhu: z.string().min(1, "Temperature is required"),
  press_speed: z.string().optional(),
  press_protect: z.string().optional(),
  total_kain: z.string().optional(),
  press_qty: z.string().min(1, "Quantity is required"),
  press_id: z.string().optional(),
});

type PressFormValues = z.infer<typeof pressFormSchema>;

interface User {
  id: string;
  name: string;
}

interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  nama_pesanan?: string;
  status: string;
}

interface PressFormProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PressForm({ order, open, onOpenChange, onSuccess }: PressFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  const form = useForm<PressFormValues>({
    resolver: zodResolver(pressFormSchema),
    defaultValues: {
      press_mesin: "",
      press_presure: "",
      press_suhu: "",
      press_speed: "",
      press_protect: "",
      total_kain: "",
      press_qty: "",
      press_id: "",
    },
  });

  // Fetch press operators
  useEffect(() => {
    async function fetchPressOperators() {
      try {
        const response = await fetch("/api/users");
        
        if (!response.ok) {
          throw new Error("Failed to fetch press operators");
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching press operators:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load users",
        });
      } finally {
        setLoadingUsers(false);
      }
    }

    fetchPressOperators();
  }, [toast]);

  // Set current user's ID for press_id when form loads
  useEffect(() => {
    if (session?.user?.id) {
      form.setValue("press_id", session.user.id);
    }
  }, [session, form]);

  async function onSubmit(values: PressFormValues) {
    setSubmitting(true);
    
    // Ensure press_id is set to current user's ID
    if (session?.user?.id) {
      values.press_id = session.user.id;
    }
    
    try {
      const response = await fetch(`/api/orders/${order.id}/production/press`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          tgl_press: new Date().toISOString(), // Add current timestamp
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update press information");
      }

      onSuccess();
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Order has been moved to Press status",
      });
    } catch (error) {
      console.error("Error submitting press form:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update press information",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Start Press Process</DialogTitle>
          <DialogDescription>
            Update order #{order.spk} to PRESS status and enter press details
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="press_mesin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Press Machine*</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter press machine"
                      className="bg-background/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="press_presure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressure*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter pressure"
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
                name="press_suhu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature* (°C)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter temperature"
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
                name="press_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speed</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter speed"
                        type="number"
                        step="0.1"
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
                name="press_protect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protect</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter protect"
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
                name="total_kain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabric Used</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter fabric used"
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
                name="press_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        className="bg-background/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
                  'Start Press Process'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 