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
  const isDtfSelected = form.watch("jenisProduk")?.DTF === true;
  
  console.log("Paper Info Section - Current values:", { 
    gsmKertas, 
    lebarKertas, 
    matchingColor,
    fileWidth,
    paperGsmOptions,
    paperWidthOptions,
    lebarKain,
    isDtfSelected
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
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                disabled={isLoadingPaperGsm}
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
                disabled={isLoadingPaperWidth || !form.watch("gsmKertas")}
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
        
        {/* Quantity with Unit Selection */}
        <div className="col-span-2">
          <FormField
            control={form.control}
            name="jumlah"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity*</FormLabel>
                <FormControl>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Enter quantity"
                      {...field}
                      className="w-full"
                      onChange={(e) => {
                        // Only allow numbers and decimal point
                        const value = e.target.value;
                        if (value === "" || /^(\d+)?\.?\d*$/.test(value)) {
                          field.onChange(value);
                        }
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="meter">meter</SelectItem>
                            <SelectItem value="yard">yard</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </FormControl>
                {/* Show warning if quantity exceeds available fabric stock - Dynamic check based on both yard/meter */}
                {selectedFabric && selectedFabric.length && parseFloat(form.watch('jumlah')) > 0 && (
                  (form.watch("unit") === "yard" && yardToMeter(parseFloat(form.watch('jumlah'))) > parseFloat(selectedFabric.length)) ? (
                    <p className="text-sm text-orange-500 mt-1">
                      Warning: Quantity exceeds available fabric stock ({selectedFabric.length} m)
                    </p>
                  ) : (form.watch("unit") === "meter" && parseFloat(form.watch('jumlah')) > parseFloat(selectedFabric.length)) && (
                    <p className="text-sm text-orange-500 mt-1">
                      Warning: Quantity exceeds available fabric stock ({selectedFabric.length} m)
                    </p>
                  )
                )}
                {/* Show unit conversion if yard is selected */}
                {form.watch('unit') === 'yard' && parseFloat(form.watch('jumlah')) > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    = {yardToMeter(parseFloat(form.watch('jumlah'))).toFixed(2)} meters
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
} 