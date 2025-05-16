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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  qty?: number;
  asal_bahan_rel?: {
    nama: string;
  };
  nama_kain?: string;
  lebar_kain?: number;
  jumlah_kain?: number;
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
      console.log("Processing press job for order:", order.id, order.spk);
      console.log("Form values:", values);
      
      // Parse the press_speed value to a number if it exists
      let press_speed = null;
      if (values.press_speed && values.press_speed.trim() !== "") {
        press_speed = parseFloat(values.press_speed);
        // Validate that it's a valid number
        if (isNaN(press_speed)) {
          press_speed = null;
        }
      }
      
      // Create a minimal update for exactly what we need
      const updateData = {
        // Must have fields
        status: "PRESS",
        statusm: "PRESS",
        
        // Press machine and settings
        press_mesin: values.press_mesin,
        press_presure: values.press_presure, 
        press_suhu: values.press_suhu,
        press_speed, // Use the parsed float value
        press_protect: values.press_protect || "",
        total_kain: values.total_kain || "",
        prints_qty: order.qty?.toString() || "0",
        press_qty: order.qty?.toString() || "0",
        
        // Set the press operator and timestamp
        press_id: values.press_id || session?.user?.id,
        tgl_press: new Date().toISOString(),
      };
      
      console.log("Simplified update data:", updateData);
      
      // Try to update directly via both APIs
      let success = false;
      let errorDetails = "";
      
      try {
        // First try the direct order update
        const directResponse = await fetch(`/api/orders/${order.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(updateData),
        });
        
        if (directResponse.ok) {
          console.log("Successfully updated via direct API");
          success = true;
        } else {
          const responseText = await directResponse.text();
          console.error("Direct API failed:", responseText);
          errorDetails += "Direct API: " + responseText + "\n";
        }
      } catch (error) {
        console.error("Error with direct API:", error);
        errorDetails += "Direct API error: " + String(error) + "\n";
      }
      
      // If the first approach failed, try the press-specific endpoint
      if (!success) {
        try {
          const pressResponse = await fetch(`/api/orders/${order.id}/production/press`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify(updateData),
          });
          
          if (pressResponse.ok) {
            console.log("Successfully updated via press API");
            success = true;
          } else {
            const responseText = await pressResponse.text();
            console.error("Press API failed:", responseText);
            errorDetails += "Press API: " + responseText;
          }
        } catch (error) {
          console.error("Error with press API:", error);
          errorDetails += "Press API error: " + String(error);
        }
      }
      
      if (success) {
        onSuccess();
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Order has been moved to Press status",
        });
      } else {
        throw new Error(`Failed to update: ${errorDetails}`);
      }
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
      <DialogContent className="sm:max-w-[600px] relative top-[-120px]">
        <DialogHeader>
          <DialogTitle>Start Press Process</DialogTitle>
          <DialogDescription>
            Update order #{order.spk} to PRESS status and enter press details
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle>Press Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 p-2 text-sm">
              <p>Fabric Origin: {order.asal_bahan_rel?.nama}</p>
              <p>Fabric Name: {order.nama_kain}</p>
              <p>Fabric Width: {order.lebar_kain}</p>
              <p>Fabric Length: {order.jumlah_kain}</p>
            </CardContent>
        </Card>

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
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Quantity
                </label>
                <Input
                  type="number"
                  value={order.qty?.toString() || "0"}
                  className="bg-muted/50"
                  disabled
                />
              </div>
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