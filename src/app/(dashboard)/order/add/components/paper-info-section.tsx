"use client"

import { UseFormReturn } from "react-hook-form"
import { OrderFormValues } from "../schemas/order-form-schema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { yardToMeter } from "../utils/order-form-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface PaperInfoSectionProps {
  form: UseFormReturn<OrderFormValues>
  paperGsmOptions: {gsm: number, remainingLength: number}[]
  paperWidthOptions: string[]
  isLoadingPaperGsm: boolean
  isLoadingPaperWidth: boolean
  selectedFabric: any
}

export function PaperInfoSection({
  form,
  paperGsmOptions,
  paperWidthOptions,
  isLoadingPaperGsm,
  isLoadingPaperWidth,
  selectedFabric
}: PaperInfoSectionProps) {
  const gsmKertas = form.watch("gsmKertas");
  const lebarKertas = form.watch("lebarKertas");
  const matchingColor = form.watch("matchingColor");
  const fileWidth = form.watch("fileWidth");
  const lebarKain = form.watch("lebarKain");
  const productTypes = form.watch("jenisProduk");
  const isDtfSelected = productTypes?.DTF === true;
  
  // Check if only PRESS is selected and no other product types
  const isPressOnly = productTypes?.PRESS && 
    !productTypes?.PRINT && 
    !productTypes?.CUTTING && 
    !productTypes?.DTF && 
    !productTypes?.SEWING;
  
  // Determine if section should be disabled
  const isSectionDisabled = isPressOnly;
  
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

  // Check if file width has enough margin from fabric width (at least 4cm)
  const hasInsufficientWidthMargin = (): boolean => {
    if (!fileWidth || !lebarKain) return false;
    
    const fileWidthNum = parseFloat(fileWidth);
    const fabricWidthNum = parseFloat(lebarKain);
    
    if (isNaN(fileWidthNum) || isNaN(fabricWidthNum)) return false;
    
    // File width should be at least 4cm less than fabric width
    return fileWidthNum > fabricWidthNum - 4;
  };

  // Calculate the maximum allowed file width based on fabric width
  const getMaxFileWidth = (): number | null => {
    if (!lebarKain) return null;
    
    const fabricWidthNum = parseFloat(lebarKain);
    if (isNaN(fabricWidthNum)) return null;
    
    return fabricWidthNum - 4;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        Design and Paper Information
        {isDtfSelected && (
          <span className="ml-2 text-sm text-blue-500 font-normal">
            (DTF Film paper will be used)
          </span>
        )}
        {isPressOnly && (
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            (Not required for PRESS only products)
          </span>
        )}
      </h3>
      
      {isPressOnly && (
        <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 mb-4">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm">When only PRESS is selected, design and paper information is not required. Only quantity field is needed.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quantity Field - Always Active */}
        <FormField
          control={form.control}
          name="jumlah"
          render={({ field }) => {
            const quantity = field.value;
            const unit = form.watch("unit");
            const fabricLength = form.watch("fabricLength");
            
            // Check if quantity exceeds fabric length
            const isExceeding = (qty: string | undefined, unit: string | undefined, length: string | undefined) => {
              if (!qty || !length || !unit) return false;
              const qtyNum = parseFloat(qty);
              const lengthNum = parseFloat(length);
              if (isNaN(qtyNum) || isNaN(lengthNum)) return false;
              const qtyInMeters = unit === 'yard' ? yardToMeter(qtyNum) : qtyNum;
              return qtyInMeters > lengthNum;
            };

            const showWarning = isExceeding(quantity, unit, fabricLength);

            return (
              <FormItem>
                <FormLabel className="font-semibold">Quantity*</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter quantity"
                    {...field}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value;
                      if (value === "" || /^(\d+)?\.?\d*$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                {showWarning && (
                  <p className="text-sm text-yellow-500">
                    Warning: Quantity exceeds available fabric length
                  </p>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
        
        {/* Unit Field - Always Active */}
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Unit*</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit">
                      {field.value}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="meter">Meter</SelectItem>
                  <SelectItem value="yard">Yard</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Rest of fields with disabled condition */}
        <div className={`contents ${isSectionDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Paper GSM */}
          <FormField
            control={form.control}
            name="gsmKertas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Paper GSM
                  {isDtfSelected ? 
                    <span className="ml-2 text-xs text-blue-500">(DTF Film)</span> : 
                    <span className="ml-2 text-xs text-muted-foreground">(Regular)</span>
                  }
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                  disabled={isSectionDisabled || isLoadingPaperGsm}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingPaperGsm ? "Loading..." : "Select paper GSM"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paperGsmOptions.length === 0 ? (
                      <SelectItem value="no-options" disabled>
                        No {isDtfSelected ? "DTF Film" : "regular"} paper GSM options available
                      </SelectItem>
                    ) : (
                      paperGsmOptions.map((option) => (
                        <SelectItem key={option.gsm} value={option.gsm.toString()}>
                          {option.gsm} gsm {isDtfSelected && "(DTF Film)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Paper Width */}
          <FormField
            control={form.control}
            name="lebarKertas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Paper Width
                  {isDtfSelected ? 
                    <span className="ml-2 text-xs text-blue-500">(DTF Film)</span> : 
                    <span className="ml-2 text-xs text-muted-foreground">(Regular)</span>
                  }
                </FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ""}
                  disabled={isSectionDisabled || isLoadingPaperWidth || !form.watch("gsmKertas")}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue 
                        placeholder={
                          isLoadingPaperWidth 
                            ? "Loading..." 
                            : !form.watch("gsmKertas") 
                            ? "Select GSM first" 
                            : "Select paper width"
                        } 
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paperWidthOptions.length === 0 ? (
                      <SelectItem value="no-options" disabled>
                        No {isDtfSelected ? "DTF Film" : "regular"} paper width options available
                      </SelectItem>
                    ) : (
                      paperWidthOptions.map((width) => (
                        <SelectItem key={width} value={width}>
                          {width} cm {isDtfSelected && "(DTF Film)"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* File Width */}
          <FormField
            control={form.control}
            name="fileWidth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>File Width</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter file width"
                    {...field}
                    onChange={(e) => {
                      // Only allow numbers and decimal point
                      const value = e.target.value;
                      if (value === "" || /^(\d+)?\.?\d*$/.test(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                {hasInsufficientWidthMargin() && (
                  <p className="text-sm text-orange-500 mt-1">
                    Warning: File width should be at least 4cm less than fabric width.
                    {getMaxFileWidth() && ` Maximum allowed: ${getMaxFileWidth()} cm`}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Matching Color */}
          <FormField
            control={form.control}
            name="matchingColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matching Color</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select option">
                        {field.value}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Design File */}
          <FormField
            control={form.control}
            name="fileDesain"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Design File</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter design file PATH"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
} 