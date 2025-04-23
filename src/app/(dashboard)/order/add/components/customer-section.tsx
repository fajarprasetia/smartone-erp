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
import { Check, ChevronsUpDown, Plus, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderFormValues } from "../schemas/order-form-schema"
import { CustomerFormDialogNew } from "@/components/marketing/customer-form-dialog-new"

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
  refreshCustomers: () => Promise<void>
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
  refreshCustomers,
}: CustomerSectionProps) {
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Customer & Order Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SPK Number Field */}
        <FormField
          control={form.control}
          name="spk"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>SPK No.</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input 
                    {...field} 
                    value={spkNumber || field.value} 
                    placeholder="SPK Number" 
                    readOnly 
                    className="bg-muted font-medium"
                  />
                </FormControl>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="outline" 
                  onClick={() => fetchSpkNumber()}
                  title="Refresh SPK Number"
                >
                  <RefreshCw className="h-4 w-4" />
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
                  <Command
                    filter={(value, search) => {
                      // If the regular filter would match, return true
                      if (value.toLowerCase().includes(search.toLowerCase())) {
                        return 1;
                      }
                      
                      // Normalize the search query for phone numbers
                      const normalizedSearch = search.replace(/^(0|62)/, '');
                      
                      // If the search looks like a phone number (only digits)
                      if (/^\d+$/.test(normalizedSearch) && value.includes(normalizedSearch)) {
                        return 1;
                      }
                      
                      return 0;
                    }}
                  >
                    <CommandInput placeholder="Search customers by phone number..." />
                    <CommandEmpty>
                      <div className="py-3 text-center">
                        <p className="text-sm text-muted-foreground mb-2">No customer found</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center justify-center w-full"
                          onClick={() => {
                            setIsCustomerOpen(false);
                            setCustomerFormOpen(true);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" /> Add New Customer
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {customers.map((customer) => (
                        <CommandItem
                          key={customer.id}
                          value={`${customer.nama.toLowerCase()} ${customer.telp || ''}`}
                          onSelect={() => {
                            form.setValue("customerId", customer.id)
                            setIsCustomerOpen(false)
                            
                            // Reset fabric name when customer changes
                            form.setValue("namaBahan", "")
                          }}
                          className="flex justify-between"
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                customer.id === form.getValues("customerId")
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span>{customer.nama}</span>
                          </div>
                          {customer.telp && (
                            <span className="text-xs text-muted-foreground">
                              {customer.telp}
                            </span>
                          )}
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
      {/* Customer Form Dialog */}
      <CustomerFormDialogNew
        open={customerFormOpen}
        customer={null}
        onClose={async (refresh, newCustomerId) => {
          setCustomerFormOpen(false);
          
          if (refresh) {
            try {
              // After a customer is added, refresh the customers list
              if (typeof refreshCustomers === 'function') {
                await refreshCustomers();
              }
              
              // If we have a new customer ID, select it in the dropdown
              if (newCustomerId) {
                // Set a small timeout to ensure the customers list is updated
                setTimeout(() => {
                  form.setValue("customerId", newCustomerId);
                  form.setValue("namaBahan", "");
                  // Force open the dropdown to show the selection
                  setIsCustomerOpen(true);
                  // Then close it after a moment
                  setTimeout(() => setIsCustomerOpen(false), 500);
                }, 300);
              }
            } catch (error) {
              console.error("Error refreshing customers:", error);
            }
          }
        }}
      />
    </div>
  )
} 