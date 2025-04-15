"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle } from "lucide-react";

const formSchema = z.object({
  ink_type: z.string().min(1, "Ink type is required"),
  color: z.string().min(1, "Color is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unit: z.string().min(1, "Unit is required"),
  user_notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const inkTypes = ["Plastisol", "Water-Based", "Discharge", "Specialty"];
const inkColors = [
  "Black", "White", "Red", "Blue", "Yellow", "Green", 
  "Orange", "Purple", "Pink", "Brown", "Gray", "Gold", "Silver"
];
const inkUnits = ["kg", "g", "l", "ml"];

export function RequestInkForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    validationMessages: string[];
    isValid: boolean;
    ink_stock?: any;
  } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ink_type: "",
      color: "",
      quantity: "",
      unit: "kg",
      user_notes: "",
    },
  });

  const validateInkRequest = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/ink-request/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to validate ink request");
      }

      const data = await response.json();
      setValidationResult(data);
      return data.isValid;
    } catch (error) {
      console.error("Error validating ink request:", error);
      toast.error("Failed to validate ink request");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const isValid = await validateInkRequest(values);
    
    if (!isValid) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/inventory/ink-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          ink_stock_id: validationResult?.ink_stock?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ink request");
      }

      toast.success("Ink request submitted successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error creating ink request:", error);
      toast.error("Failed to create ink request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Request Ink</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ink_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ink Type</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ink type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inkTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inkColors.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inkUnits.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="user_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter additional notes here"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {validationResult && (
            <Alert className={validationResult.isValid ? "bg-green-50" : "bg-red-50"}>
              <div className="flex items-start gap-2">
                {validationResult.isValid ? 
                  <CheckCircle className="h-5 w-5 text-green-500" /> : 
                  <XCircle className="h-5 w-5 text-red-500" />
                }
                <AlertDescription>
                  <ul className="list-disc pl-5 space-y-1">
                    {validationResult.validationMessages.map((message, i) => (
                      <li key={i}>{message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (validationResult && !validationResult.isValid)}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 