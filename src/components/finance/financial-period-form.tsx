"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

// Form schema validation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date({ required_error: "Start date is required" }),
  endDate: z.date({ required_error: "End date is required" }),
  type: z.string().min(1, "Type is required"),
  year: z.coerce.number().int().min(2000, "Year must be 2000 or later"),
  quarter: z.coerce.number().int().min(1).max(4).optional().nullable(),
  month: z.coerce.number().int().min(1).max(12).optional().nullable(),
  status: z.string().default("OPEN"),
})

// Form values type
type FormValues = z.infer<typeof formSchema>

// Props
interface FinancialPeriodFormProps {
  periodId?: string // If provided, we're editing an existing period
}

export default function FinancialPeriodForm({ periodId }: FinancialPeriodFormProps) {
  const [loading, setLoading] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const router = useRouter()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      startDate: new Date(),
      endDate: new Date(),
      type: "FISCAL",
      year: new Date().getFullYear(),
      quarter: null,
      month: null,
      status: "OPEN",
    },
  })

  // Fetch period data if editing
  useEffect(() => {
    if (periodId) {
      setIsEdit(true)
      fetchPeriod()
    }
  }, [periodId])

  // Fetch period data
  const fetchPeriod = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/finance/periods/${periodId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch period")
      }
      
      const data = await response.json()
      
      // Format dates properly
      form.reset({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        year: Number(data.year),
        quarter: data.quarter !== null ? Number(data.quarter) : null,
        month: data.month !== null ? Number(data.month) : null,
      })
    } catch (error) {
      console.error("Error fetching period:", error)
      toast.error("Failed to load financial period")
      router.push("/finance/periods")
    } finally {
      setLoading(false)
    }
  }

  // Form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)
      
      const url = isEdit 
        ? `/api/finance/periods/${periodId}` 
        : "/api/finance/periods"
      
      const method = isEdit ? "PATCH" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save financial period")
      }
      
      toast.success(
        isEdit 
          ? "Financial period updated successfully" 
          : "Financial period created successfully"
      )
      
      router.push("/finance/periods")
      router.refresh()
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("Failed to save financial period")
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle type change
  const handleTypeChange = (value: string) => {
    form.setValue("type", value)
    
    // Reset quarter and month based on type
    if (value === "QUARTER") {
      form.setValue("quarter", 1)
      form.setValue("month", null)
    } else if (value === "MONTH") {
      form.setValue("month", 1)
      form.setValue("quarter", null)
    } else {
      form.setValue("quarter", null)
      form.setValue("month", null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Financial Period" : "Create Financial Period"}</CardTitle>
        <CardDescription>
          {isEdit
            ? "Update the details of an existing financial period"
            : "Set up a new financial period for accounting and reporting"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 FY 2024" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give this period a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Type</FormLabel>
                    <Select 
                      onValueChange={handleTypeChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FISCAL">Fiscal Year</SelectItem>
                        <SelectItem value="CALENDAR">Calendar Year</SelectItem>
                        <SelectItem value="QUARTER">Quarter</SelectItem>
                        <SelectItem value="MONTH">Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The type of accounting period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Year */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The year for this financial period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Quarter (conditional) */}
              {form.watch("type") === "QUARTER" && (
                <FormField
                  control={form.control}
                  name="quarter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quarter</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || "1"}
                        value={field.value?.toString() || "1"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quarter" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Q1</SelectItem>
                          <SelectItem value="2">Q2</SelectItem>
                          <SelectItem value="3">Q3</SelectItem>
                          <SelectItem value="4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The quarter number (1-4)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Month (conditional) */}
              {form.watch("type") === "MONTH" && (
                <FormField
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Month</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || "1"}
                        value={field.value?.toString() || "1"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">January</SelectItem>
                          <SelectItem value="2">February</SelectItem>
                          <SelectItem value="3">March</SelectItem>
                          <SelectItem value="4">April</SelectItem>
                          <SelectItem value="5">May</SelectItem>
                          <SelectItem value="6">June</SelectItem>
                          <SelectItem value="7">July</SelectItem>
                          <SelectItem value="8">August</SelectItem>
                          <SelectItem value="9">September</SelectItem>
                          <SelectItem value="10">October</SelectItem>
                          <SelectItem value="11">November</SelectItem>
                          <SelectItem value="12">December</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The month number (1-12)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                    <FormDescription>
                      The start date of the financial period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
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
                    <FormDescription>
                      The end date of the financial period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The current status of this period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push("/finance/periods")}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Period" : "Create Period"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
} 