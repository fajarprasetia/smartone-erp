"use client"

import { UseFormReturn } from "react-hook-form"
import { FabricInfo, OrderFormValues } from "../schemas/order-form-schema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
import { yardToMeter } from "../utils/order-form-utils"

interface FabricInfoSectionProps {
  form: UseFormReturn<OrderFormValues>
  fabricNames: FabricInfo[]
  isFabricNameOpen: boolean
  setIsFabricNameOpen: (value: boolean) => void
  selectedFabric: FabricInfo | null
  setSelectedFabric: (value: FabricInfo | null) => void
}

export function FabricInfoSection({
  form,
  fabricNames,
  isFabricNameOpen,
  setIsFabricNameOpen,
  selectedFabric,
  setSelectedFabric,
}: FabricInfoSectionProps) {
  const asalBahan = form.watch("asalBahan");
  const namaBahan = form.watch("namaBahan");
  const aplikasiProduk = form.watch("aplikasiProduk");
  
  console.log("Fabric Info Section - Current values:", { 
    asalBahan, 
    namaBahan, 
    aplikasiProduk, 
    selectedFabric 
  });

  // Check if quantity exceeds available fabric length
  const isExceedingFabricLength = (quantity: string, unit: string, availableLength?: number | string): boolean => {
    if (!quantity || !availableLength) return false;
    
    const qty = parseFloat(quantity);
    const available = typeof availableLength === 'string' ? parseFloat(availableLength) : availableLength;
    
    if (isNaN(qty) || isNaN(available)) return false;
    
    // Convert to meters for comparison if unit is yard
    const qtyInMeters = unit === 'yard' ? yardToMeter(qty) : qty;
    
    return qtyInMeters > available;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Fabric Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fabric Origins */}
        <FormField
          control={form.control}
          name="asalBahan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Origin*</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fabric origin">
                      {field.value}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="SMARTONE">SMARTONE</SelectItem>
                  <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Fabric Name */}
        <FormField
          control={form.control}
          name="namaBahan"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fabric Name</FormLabel>
              <Popover open={isFabricNameOpen} onOpenChange={setIsFabricNameOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isFabricNameOpen}
                      className="justify-between w-full"
                      disabled={!form.watch("asalBahan") || fabricNames.length === 0}
                    >
                      {field.value
                        ? fabricNames.find((fabric) => fabric.name === field.value)?.name || "Select Fabric"
                        : "Select Fabric"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                  <Command>
                    <CommandInput placeholder="Search fabrics..." />
                    <CommandEmpty>No fabric found.</CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {fabricNames.map((fabric) => (
                        <CommandItem
                          key={fabric.id}
                          value={fabric.name}
                          onSelect={() => {
                            form.setValue("namaBahan", fabric.name);
                            // Set the selected fabric for display of details
                            setSelectedFabric(fabric);
                            setIsFabricNameOpen(false);
                          }}
                        >
                          {fabric.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedFabric && (
                <div className="mt-2 text-sm text-muted-foreground">
                  {selectedFabric.composition && (
                    <p>Composition: {selectedFabric.composition}</p>
                  )}
                  {selectedFabric.length && (
                    <p>Length: {selectedFabric.length} m</p>
                  )}
                  {selectedFabric.width && (
                    <p>Width: {selectedFabric.width}</p>
                  )}
                  {selectedFabric.remainingLength && (
                    <p>Remaining: {selectedFabric.remainingLength} m</p>
                  )}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Application */}
        <FormField
          control={form.control}
          name="aplikasiProduk"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Application</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter product application"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
} 