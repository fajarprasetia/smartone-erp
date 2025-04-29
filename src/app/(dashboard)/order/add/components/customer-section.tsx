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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Plus, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderFormValues, Customer } from "../schemas/order-form-schema"
import { CustomerFormDialogNew } from "@/components/marketing/customer-form-dialog-new"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CustomerSectionProps {
  form: UseFormReturn<OrderFormValues>
  customers: Customer[]
  marketingUsers: Array<{ id: string; name: string; email: string }>
  spkNumber: string
  fetchSpkNumber: () => Promise<void>
  refreshCustomers: () => Promise<Customer[]>
}

export function CustomerSection({
  form,
  customers,
  marketingUsers,
  spkNumber,
  fetchSpkNumber,
  refreshCustomers,
}: CustomerSectionProps) {
  const [customerFormOpen, setCustomerFormOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [marketingSearch, setMarketingSearch] = useState("");
  
  const filteredCustomers = customers.filter(customer => 
    customer.nama.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (customer.telp && customer.telp.includes(customerSearch))
  );

  const filteredMarketingUsers = marketingUsers.filter(user =>
    user.name.toLowerCase().includes(marketingSearch.toLowerCase())
  );

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
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("namaBahan", "");
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer">
                      {field.value ? customers.find(c => c.id === field.value)?.nama : "Select customer"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search customers..."
                      className="mb-2"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id}
                          className="flex justify-between"
                        >
                          <span>{customer.nama}</span>
                          {customer.telp && (
                            <span className="text-xs text-muted-foreground">
                              0{customer.telp}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs w-full mt-2"
                      onClick={() => setCustomerFormOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add New Customer
                    </Button>
                  </div>
                </SelectContent>
              </Select>
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
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marketing">
                      {field.value ? marketingUsers.find(m => m.id === field.value)?.name : "Select marketing"}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search marketing users..."
                      className="mb-2"
                      value={marketingSearch}
                      onChange={(e) => setMarketingSearch(e.target.value)}
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                      {filteredMarketingUsers.map((user) => (
                        <SelectItem
                          key={user.id}
                          value={user.id}
                        >
                          {user.name}
                        </SelectItem>
                      ))}
                    </div>
                  </div>
                </SelectContent>
              </Select>
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
                form.setValue("customerId", newCustomerId);
                form.setValue("namaBahan", "");
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