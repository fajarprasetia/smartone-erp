"use client"

import { UseFormReturn } from "react-hook-form"
import { Customer, MarketingUser, OrderFormValues } from "../schemas/order-form-schema"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

interface CustomerInfoSectionProps {
  form: UseFormReturn<OrderFormValues>
  customers: Customer[]
  marketingUsers: MarketingUser[]
  isCustomerOpen: boolean
  setIsCustomerOpen: (value: boolean) => void
  isMarketingOpen: boolean
  setIsMarketingOpen: (value: boolean) => void
}

export function CustomerInfoSection({
  form,
  customers,
  marketingUsers,
  isCustomerOpen,
  setIsCustomerOpen,
  isMarketingOpen,
  setIsMarketingOpen,
}: CustomerInfoSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Customer Selection */}
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
                    aria-expanded={isCustomerOpen}
                    className="justify-between"
                  >
                    {field.value
                      ? customers.find((customer) => customer.id === field.value)?.nama
                      : "Select Customer"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
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
                        }}
                      >
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
      
      {/* SPK Number */}
      <FormField
        control={form.control}
        name="spk"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SPK Number</FormLabel>
            <FormControl>
              <Input
                placeholder="SPK number"
                {...field}
                readOnly
                className="bg-muted"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Marketing */}
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
                    aria-expanded={isMarketingOpen}
                    className="justify-between"
                  >
                    {field.value
                      ? marketingUsers.find((user) => user.name === field.value)?.name
                      : "Select Marketing"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                <Command>
                  <CommandInput placeholder="Search marketing users..." />
                  <CommandEmpty>No marketing user found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {marketingUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.name}
                        onSelect={() => {
                          form.setValue("marketing", user.name)
                          setIsMarketingOpen(false)
                        }}
                      >
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
  )
} 