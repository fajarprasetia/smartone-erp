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
const pressDoneFormSchema = z.object({
  press_bagus: z.string().min(1, "Number of good items is required"),
  press_waste: z.string().optional(),
  catatan_press: z.string().optional(),
  press_mesin: z.string().optional(),
  press_presure: z.string().optional(),
  press_suhu: z.string().optional(),
  press_protect: z.string().optional(),
  press_speed: z.union([z.string(), z.number(), z.null()]).optional(),
  total_kain: z.string().optional(),
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
  press_bagus?: string;
  press_waste?: string;
  catatan_press?: string;
  press_done?: string;
  press_mesin?: string;
  press_presure?: string;
  press_suhu?: string;
  press_protect?: string;
  press_speed?: number | string | null;
  total_kain?: string;
  asal_bahan_rel?: {
    nama: string;
  };
  nama_kain?: string;
  lebar_kain?: number;
  jumlah_kain?: number;
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
      press_bagus: order.press_bagus || "",
      press_waste: order.press_waste || "",
      catatan_press: order.catatan_press || "",
      press_mesin: order.press_mesin || "",
      press_presure: order.press_presure || "",
      press_suhu: order.press_suhu || "",
      press_protect: order.press_protect || "",
      press_speed: order.press_speed !== null && order.press_speed !== undefined
        ? String(order.press_speed)
        : "",
      total_kain: order.total_kain || "",
    },
  });

  // Watch values to provide real-time feedback
  const goodCount = form.watch("press_bagus");
  const wasteCount = form.watch("press_waste");
  
  // Calculate total and difference
  const currentGood = goodCount ? parseInt(goodCount) : 0;
  const currentWaste = wasteCount ? parseInt(wasteCount) : 0;
  const currentTotal = currentGood + currentWaste;
  const difference = totalQty - currentTotal;

  async function onSubmit(values: PressDoneFormValues) {
    setSubmitting(true);
    try {
      // Check product type to determine status update
      const isPressOnly = order.produk === "PRESS ONLY";
      const needsCutting = (order.produk || "").includes("CUTTING");
      
      console.log("Processing press done for order:", order.spk);
      console.log("Order product type:", order.produk);
      console.log("Form values:", values);
      
      // Determine next status based on product type
      let nextStatus, nextStatusM;
      
      if (isPressOnly) {
        nextStatus = "COMPLETED";
        nextStatusM = "COMPLETED";
      } else if (needsCutting) {
        nextStatus = "CUTTING READY";
        nextStatusM = "PRESS DONE";
      } else {
        // Default to COMPLETED if not press only or needs cutting
        nextStatus = "COMPLETED";
        nextStatusM = "PRESS DONE";
      }
      
      // Create a minimal update for exactly what we need
      const updateData = {
        // Set press completion fields
        press_bagus: values.press_bagus,
        press_waste: values.press_waste || "",
        catatan_press: values.catatan_press || "",
        press_done: new Date().toISOString(),
        
        // Additional press details
        press_mesin: values.press_mesin || "",
        press_presure: values.press_presure || "",
        press_suhu: values.press_suhu || "",
        press_protect: values.press_protect || "",
        press_speed: values.press_speed || "",
        total_kain: values.total_kain || "",
        
        // Update status based on product type
        status: nextStatus,
        statusm: nextStatusM
      };
      
      console.log("Press done update data:", updateData);
      
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
      
      // If the first approach failed, try the press-done specific endpoint
      if (!success) {
        try {
          const pressResponse = await fetch(`/api/orders/${order.id}/production/press-done`, {
            method: "PATCH",
            headers: { 
              "Content-Type": "application/json" 
            },
            body: JSON.stringify(updateData),
          });
          
          if (pressResponse.ok) {
            console.log("Successfully updated via press-done API");
            success = true;
          } else {
            const responseText = await pressResponse.text();
            console.error("Press-done API failed:", responseText);
            errorDetails += "Press-done API: " + responseText;
          }
        } catch (error) {
          console.error("Error with press-done API:", error);
          errorDetails += "Press-done API error: " + String(error);
        }
      }
      
      if (success) {
        onSuccess();
        onOpenChange(false);
        toast({
          title: "Success",
          description: isPressOnly 
            ? "Press job completed and marked as COMPLETED" 
            : needsCutting
              ? "Press job completed and moved to CUTTING READY"
              : "Press job has been marked as completed",
        });
      } else {
        throw new Error(`Failed to update: ${errorDetails}`);
      }
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
      <DialogContent className="sm:max-w-[600px] relative top-[-10px]">
        <DialogHeader>
          <DialogTitle>Complete Press Job</DialogTitle>
          <DialogDescription>
            Mark press job for order #{order.spk} as completed
          </DialogDescription>
        </DialogHeader>

        {order.asal_bahan_rel || order.nama_kain ? (
          <Card>
            <CardHeader>
              <CardTitle>Fabric Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 p-2 text-sm">
              <p>Fabric Origin: {order.asal_bahan_rel?.nama}</p>
              <p>Fabric Name: {order.nama_kain}</p>
              <p>Fabric Width: {order.lebar_kain}</p>
              <p>Fabric Length: {order.jumlah_kain}</p>
            </CardContent>
          </Card>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="press_mesin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Press Machine</FormLabel>
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
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
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
                name="press_presure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pressure</FormLabel>
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
                    <FormLabel>Temperature (°C)</FormLabel>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <span className="font-semibold">Expected Qty:</span> {totalQty} m
                </div>
                <div>
                  <span className="font-semibold">Actual:</span> {currentTotal} m
                </div>
                <div className={difference !== 0 ? "text-red-500" : "text-green-500"}>
                  <span className="font-semibold">Difference:</span> {difference} m
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