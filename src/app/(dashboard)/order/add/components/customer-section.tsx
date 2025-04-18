"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderFormValues } from "../schemas/order-form-schema"

interface CustomerSectionProps {
  form: UseFormReturn<OrderFormValues>
  customers: Array<{ id: string; nama: string; telp?: string }>
  marketingUsers: Array<{ id: string; name: string; email: string }>
  isCustomerOpen: boolean
  setIsCustomerOpen: (open: boolean) => void
  isMarketingOpen: boolean
  setIsMarketingOpen: (open: boolean) => void
  spkNumber: string
  fetchSpkNumber: () => Promise<void>
}

export function CustomerSection({
  form,
  customers,
  marketingUsers,
  isCustomerOpen,
  setIsCustomerOpen,
  isMarketingOpen,
  setIsMarketingOpen,
  spkNumber,
  fetchSpkNumber,
}: CustomerSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Customer & Order Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SPK Number Field */}
        <FormField
          control={form.control}
          name="spk"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SPK Number</FormLabel>
              <div className="flex gap-2">
                <FormControl className="flex-1">
                  <Input
                    {...field}
                    value={spkNumber || field.value}
                    readOnly
                    className="bg-muted font-medium"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={fetchSpkNumber}
                  title="Refresh SPK Number"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Customer Selection Field */}
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Customer*</FormLabel>
              <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between w-full",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? customers.find((customer) => customer.id === field.value)?.nama ||
                          "Select customer"
                        : "Select customer"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.nama}
                          onSelect={() => {
                            form.setValue("customerId", customer.id)
                            setIsCustomerOpen(false)
                            
                            // Reset fabric name when customer changes
                            form.setValue("namaBahan", "")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customer.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {customer.nama}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Marketing User Selection Field */}
        <FormField
          control={form.control}
          name="marketing"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Marketing</FormLabel>
              <Popover open={isMarketingOpen} onOpenChange={setIsMarketingOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "justify-between w-full",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value
                        ? marketingUsers.find((user) => user.id === field.value)?.name ||
                          "Select marketing"
                        : "Select marketing"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[300px]">
                  <Command>
                    <CommandInput placeholder="Search marketing users..." />
                    <CommandEmpty>No marketing user found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {marketingUsers.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.name}
                          onSelect={() => {
                            form.setValue("marketing", user.id)
                            setIsMarketingOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              user.id === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {user.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
} 