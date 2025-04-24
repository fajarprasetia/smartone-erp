"use client"

import { UseFormReturn } from "react-hook-form"
import { FabricInfo, OrderFormValues } from "../schemas/order-form-schema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { AlertCircle, ChevronsUpDown } from "lucide-react"
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
  const productTypes = form.watch("jenisProduk");
  const isDtfSelected = productTypes?.DTF === true;
  
  // Check if only PRINT is selected and no other product types
  const isPrintOnly = productTypes?.PRINT && 
    !productTypes?.PRESS && 
    !productTypes?.CUTTING && 
    !productTypes?.DTF && 
    !productTypes?.SEWING;
  
  // Determine if section should be disabled
  const isSectionDisabled = isDtfSelected || isPrintOnly;
  
  console.log("Fabric Info Section - Current values:", { 
    asalBahan, 
    namaBahan, 
    aplikasiProduk, 
    selectedFabric,
    isDtfSelected,
    isPrintOnly
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
      <h3 className="text-lg font-medium">
        Fabric Information
        {isDtfSelected && (
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            (Not required for DTF products)
          </span>
        )}
        {isPrintOnly && (
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            (Not required for PRINT only products)
          </span>
        )}
      </h3>
      
      {isDtfSelected && (
        <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mb-4">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">When DTF is selected, fabric information is not required and will not be used in processing the order.</p>
        </div>
      )}
      
      {isPrintOnly && (
        <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mb-4">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">When only PRINT is selected, fabric information is not required and will not be used in processing the order.</p>
        </div>
      )}
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSectionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Fabric Origins */}
        <FormField
          control={form.control}
          name="asalBahan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Origin{!isSectionDisabled && "*"}</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
                defaultValue={field.value}
                disabled={isSectionDisabled}
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
              <Popover 
                open={isFabricNameOpen && !isSectionDisabled} 
                onOpenChange={(open) => !isSectionDisabled && setIsFabricNameOpen(open)}
              >
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isFabricNameOpen}
                      className="justify-between w-full"
                      disabled={isSectionDisabled || !form.watch("asalBahan") || fabricNames.length === 0}
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
                            // Set fabric width if available
                            if (fabric.width) {
                              form.setValue("lebarKain", fabric.width);
                            }
                            // Set fabric length if available
                            if (fabric.length) {
                              form.setValue("fabricLength", fabric.length);
                            }
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
      
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isSectionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                
        {/* Fabric Width */}
        <FormField
          control={form.control}
          name="lebarKain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Width</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter fabric width"
                  {...field}
                  disabled={isSectionDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Fabric Length */}
        <FormField
          control={form.control}
          name="fabricLength"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fabric Length</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter fabric length"
                  {...field}
                  disabled={isSectionDisabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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