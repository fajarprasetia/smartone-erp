"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { Bill } from "./PayableTable";

// Payment form schema
const paymentFormSchema = z.object({
  date: z.date({
    required_error: "Payment date is required",
  }),
  amount: z.coerce
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),
  method: z.string({
    required_error: "Payment method is required",
  }),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
  onClose?: () => void;
  bill?: any;
  onSuccess?: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  bill,
  onSuccess,
}: PaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  
  // Handle both open patterns (open/onOpenChange and isOpen/onClose)
  const dialogOpen = open ?? isOpen ?? false;
  const handleOpenChange = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    if (!value && onClose) onClose();
  };

  // Initialize form with default values
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      date: new Date(),
      amount: bill ? bill.remainingAmount : 0,
      method: "bank_transfer",
      reference: "",
      notes: "",
    },
  });

  // Reset form when bill changes
  useEffect(() => {
    if (bill) {
      form.reset({
        date: new Date(),
        amount: bill.remainingAmount,
        method: "bank_transfer",
        reference: "",
        notes: "",
      });
    }
  }, [bill, form]);

  // Fetch accounts when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      fetchAccounts();
    }
  }, [dialogOpen]);

  // Fetch accounts from API
  async function fetchAccounts() {
    try {
      const response = await fetch("/api/finance/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data.accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts. Please try again.");
    }
  }

  // Handle form submission
  async function onSubmit(data: PaymentFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/finance/payable", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          billId: bill.id,
          paymentDate: format(data.date, "yyyy-MM-dd"),
          amount: data.amount,
          paymentMethod: data.method,
          reference: data.reference,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }

      toast.success("Payment recorded successfully");
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error(
        typeof error === "object" && error !== null && "message" in error 
          ? (error as Error).message 
          : "Failed to process payment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for bill #{bill?.billNumber} - {bill?.vendorName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="font-medium">Bill Amount:</div>
              <div className="text-right">{bill ? formatCurrency(bill.totalAmount) : ""}</div>
              
              <div className="font-medium">Amount Paid:</div>
              <div className="text-right">{bill ? formatCurrency(bill.paidAmount) : ""}</div>
              
              <div className="font-medium">Balance Due:</div>
              <div className="text-right font-bold">{bill ? formatCurrency(bill.remainingAmount) : ""}</div>
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0.00"
                      {...field}
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={bill?.remainingAmount}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Transaction ID, Check #, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional payment details"
                      className="resize-none"
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
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 