"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { ChartOfAccount, FinancialPeriod, JournalEntry, JournalEntryItem } from "@/types/prisma"

// Define schema for the journal entry items
const journalEntryItemSchema = z.object({
  id: z.string().optional(),
  accountId: z.string({
    required_error: "Account is required",
  }),
  description: z.string().optional(),
  debit: z.coerce.number().min(0, "Debit must be greater than or equal to 0"),
  credit: z.coerce.number().min(0, "Credit must be greater than or equal to 0"),
}).refine(data => {
  // Either debit or credit should be greater than 0, but not both
  return (data.debit > 0 && data.credit === 0) || (data.credit > 0 && data.debit === 0);
}, {
  message: "Either debit or credit must be specified, but not both",
  path: ["debit"],
});

// Define schema for the journal entry form
const journalEntryFormSchema = z.object({
  entryNumber: z.string().optional(),
  date: z.date({
    required_error: "Date is required",
  }),
  periodId: z.string({
    required_error: "Financial period is required",
  }),
  description: z.string().optional(),
  reference: z.string().optional(),
  items: z.array(journalEntryItemSchema).min(2, "At least two items are required")
}).refine(data => {
  // Calculate total debits and credits
  const totalDebit = data.items.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = data.items.reduce((sum, item) => sum + item.credit, 0);
  
  // Debits must equal credits
  return Math.abs(totalDebit - totalCredit) < 0.001; // Allow for floating point imprecision
}, {
  message: "Total debits must equal total credits",
  path: ["items"],
});

type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;

interface JournalEntryWithItems extends JournalEntry {}

interface JournalEntryFormProps {
  accounts: ChartOfAccount[];
  periods: FinancialPeriod[];
  entry?: JournalEntryWithItems;
  isSubmitting: boolean;
  onSubmit: (values: JournalEntryFormValues) => Promise<void>;
  onCancel: () => void;
}

export function JournalEntryForm({
  accounts,
  periods,
  entry,
  isSubmitting,
  onSubmit,
  onCancel,
}: JournalEntryFormProps) {
  const [totalDebit, setTotalDebit] = useState<number>(0);
  const [totalCredit, setTotalCredit] = useState<number>(0);
  
  // Initialize form with existing entry data or defaults
  const defaultValues: JournalEntryFormValues = entry
    ? {
        entryNumber: entry.entryNumber,
        date: new Date(entry.date),
        periodId: entry.periodId,
        description: entry.description || "",
        reference: entry.reference || "",
        items: entry.items.map(item => ({
          id: item.id,
          accountId: item.accountId,
          description: item.description || "",
          debit: item.debit,
          credit: item.credit,
        })),
      }
    : {
        entryNumber: "",
        date: new Date(),
        periodId: "",
        description: "",
        reference: "",
        items: [
          { accountId: "", description: "", debit: 0, credit: 0 },
          { accountId: "", description: "", debit: 0, credit: 0 },
        ],
      };
  
  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues,
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  // Calculate totals when form values change
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only recalculate if we're changing items
      if (name && name.startsWith('items')) {
        const items = value.items || [];
        const newTotalDebit = items.reduce((sum, item) => sum + (Number(item?.debit) || 0), 0);
        const newTotalCredit = items.reduce((sum, item) => sum + (Number(item?.credit) || 0), 0);
        
        setTotalDebit(newTotalDebit);
        setTotalCredit(newTotalCredit);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Handle form submission
  const handleSubmit = async (values: JournalEntryFormValues) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Failed to submit journal entry:", error);
      toast.error("Failed to save journal entry. Please try again.");
    }
  };
  
  // Add a new line item
  const addItem = () => {
    append({ accountId: "", description: "", debit: 0, credit: 0 });
  };
  
  // Get active accounts only
  const activeAccounts = accounts.filter(account => account.isActive);
  
  // Get active periods
  const activePeriods = periods.filter(period => period.status === "OPEN");
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="entryNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Auto-generated if left empty" 
                    {...field} 
                    value={field.value || ""}
                    disabled={!!entry} // Disable editing if updating existing entry
                  />
                </FormControl>
                <FormDescription>
                  {entry ? "Entry number cannot be changed" : "Leave blank for auto-generated number"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
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
            name="periodId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial Period</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select financial period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activePeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({format(new Date(period.startDate), "dd/MM/yyyy")} - {format(new Date(period.endDate), "dd/MM/yyyy")})
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
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Optional reference number" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Such as invoice number, check number, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Journal entry description" 
                    {...field} 
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Journal Entry Items</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addItem}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Line
            </Button>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Account</th>
                  <th className="text-left p-2 font-medium">Description</th>
                  <th className="text-right p-2 font-medium">Debit</th>
                  <th className="text-right p-2 font-medium">Credit</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.id} className="border-b">
                    <td className="p-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.code} - {account.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="p-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                placeholder="Description" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="p-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.debit`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value && Number(e.target.value) > 0) {
                                    // If debit is entered, clear credit
                                    form.setValue(`items.${index}.credit`, 0);
                                  }
                                }}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="p-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.credit`}
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  if (e.target.value && Number(e.target.value) > 0) {
                                    // If credit is entered, clear debit
                                    form.setValue(`items.${index}.debit`, 0);
                                  }
                                }}
                                className="text-right"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="p-2">
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {/* Totals row */}
                <tr className="border-t bg-muted/50">
                  <td colSpan={2} className="p-2 text-right font-medium">
                    Total
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(totalCredit)}
                  </td>
                  <td className="p-2"></td>
                </tr>
                
                {/* Difference row */}
                {Math.abs(totalDebit - totalCredit) > 0.001 && (
                  <tr className="border-t bg-red-50 dark:bg-red-950/20">
                    <td colSpan={2} className="p-2 text-right font-medium text-red-600 dark:text-red-400">
                      Difference
                    </td>
                    <td className="p-2 text-right font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(Math.abs(totalDebit - totalCredit))}
                    </td>
                    <td className="p-2"></td>
                    <td className="p-2"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || Math.abs(totalDebit - totalCredit) > 0.001}
          >
            {isSubmitting ? "Saving..." : entry ? "Update Journal Entry" : "Create Journal Entry"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 