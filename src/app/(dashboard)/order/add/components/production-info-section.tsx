"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { OrderFormValues, RepeatOrder } from "../schemas/order-form-schema"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { DialogModal } from "@/components/ui/dialog-modal"

interface ProductionInfoSectionProps {
  form: UseFormReturn<OrderFormValues>
  repeatOrders: RepeatOrder[]
  showRepeatOrders: boolean
  setShowRepeatOrders: (value: boolean) => void
}

export function ProductionInfoSection({
  form,
  repeatOrders,
  showRepeatOrders,
  setShowRepeatOrders,
}: ProductionInfoSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Produksi */}
        <FormField
          control={form.control}
          name="statusProduksi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Production Status*</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value)
                if (value === "REPEAT") {
                  setShowRepeatOrders(true)
                }
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select production status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NEW">NEW</SelectItem>
                  <SelectItem value="REPEAT">REPEAT</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Category */}
        <FormField
          control={form.control}
          name="kategori"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category*</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="REGULAR ORDER">REGULAR ORDER</SelectItem>
                  <SelectItem value="ONE DAY SERVICE">ONE DAY SERVICE</SelectItem>
                  <SelectItem value="PROJECT">PROJECT</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Target Completion Date */}
        <FormField
          control={form.control}
          name="targetSelesai"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Target Completion Date*</FormLabel>
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
                    disabled={(date: Date) =>
                      date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 6))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Repeat Orders Dialog */}
      <DialogModal
        title="Select Repeat Order"
        description="Choose a previous order to repeat"
        open={showRepeatOrders}
        onOpenChange={setShowRepeatOrders}
      >
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {repeatOrders.map((order) => (
            <div
              key={order.spk}
              className="border rounded-md p-4 hover:bg-accent transition-colors"
            >
              <div className="grid grid-cols-2 gap-2 mb-2">
                <p className="font-medium">SPK Number:</p>
                <p>{order.spk}</p>
                <p className="font-medium">Order Date:</p>
                <p>{order.orderDate}</p>
              </div>
              <p className="font-medium">Details:</p>
              <p className="whitespace-pre-wrap text-sm mt-1">{order.details}</p>
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    form.setValue("notes", `REPEAT SPK No. ${order.spk}`);
                    setShowRepeatOrders(false);
                  }}
                >
                  Choose
                </Button>
              </div>
            </div>
          ))}
          {repeatOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No repeat orders found for this customer.
            </div>
          )}
        </div>
      </DialogModal>
    </>
  )
} 