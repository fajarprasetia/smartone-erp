"use client"

import { useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { OrderFormValues } from "../schemas/order-form-schema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"
import { calculateItemTotal } from "../utils/order-form-utils"
import { formatCurrency } from "@/lib/utils"

interface PricingSectionProps {
  form: UseFormReturn<OrderFormValues>
}

export function PricingSection({
  form,
}: PricingSectionProps) {
  const additionalCosts = form.watch("additionalCosts") || []
  const harga = form.watch("harga");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const tax = form.watch("tax");
  const taxPercentage = form.watch("taxPercentage");
  const totalPrice = form.watch("totalPrice");
  
  console.log("Pricing Section - Current values:", { 
    harga, 
    additionalCosts, 
    discountType,
    discountValue,
    tax,
    taxPercentage,
    totalPrice
  });

  const addCost = () => {
    if (additionalCosts.length >= 6) return // Limit to 6 items
    
    const updatedCosts = [...additionalCosts, { item: "", pricePerUnit: "", unitQuantity: "", total: "" }]
    form.setValue("additionalCosts", updatedCosts)
  }

  const removeCost = (index: number) => {
    const updatedCosts = additionalCosts.filter((_, i) => i !== index)
    form.setValue("additionalCosts", updatedCosts)
  }

  // Helper function to update total price when inputs change
  const updateTotalPrice = () => {
    const quantity = form.getValues("jumlah");
    const unitPrice = form.getValues("harga");
    const additionalCosts = form.getValues("additionalCosts");
    const discountType = form.getValues("discountType");
    const discountValue = form.getValues("discountValue");
    const applyTax = form.getValues("tax");
    const unit = form.getValues("unit");
    
    // Import and call the calculate function from utils
    import("../utils/order-form-utils").then(({ calculateTotalPrice }) => {
      const totalPrice = calculateTotalPrice(
        quantity,
        unitPrice,
        additionalCosts,
        discountType,
        discountValue,
        applyTax,
        unit
      );
      form.setValue("totalPrice", totalPrice);
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Pricing Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unit Price */}
        <FormField
          control={form.control}
          name="harga"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price*</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter unit price"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    updateTotalPrice()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      {/* Additional Costs */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium">Additional Costs</h4>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addCost}
            disabled={additionalCosts.length >= 6}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Cost
          </Button>
        </div>
        
        {additionalCosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No additional costs added.</p>
        ) : (
          <div className="space-y-2 border rounded-md p-3">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-2 mb-1 text-xs font-medium text-muted-foreground">
              <div className="col-span-5">Item</div>
              <div className="col-span-2">Price/Unit</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Cost Items */}
            {additionalCosts.map((cost, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input 
                    placeholder="Description" 
                    value={cost.item} 
                    onChange={(e) => {
                      const updatedCosts = [...additionalCosts];
                      updatedCosts[index].item = e.target.value;
                      form.setValue("additionalCosts", updatedCosts);
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Price" 
                    value={cost.pricePerUnit} 
                    onChange={(e) => {
                      const updatedCosts = [...additionalCosts];
                      updatedCosts[index].pricePerUnit = e.target.value;
                      
                      // Calculate total
                      if (e.target.value && updatedCosts[index].unitQuantity) {
                        const price = parseFloat(e.target.value);
                        const quantity = parseFloat(updatedCosts[index].unitQuantity || "0");
                        updatedCosts[index].total = calculateItemTotal(price, quantity);
                      }
                      
                      form.setValue("additionalCosts", updatedCosts);
                      updateTotalPrice();
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    placeholder="Qty" 
                    value={cost.unitQuantity} 
                    onChange={(e) => {
                      const updatedCosts = [...additionalCosts];
                      updatedCosts[index].unitQuantity = e.target.value;
                      
                      // Calculate total
                      if (e.target.value && updatedCosts[index].pricePerUnit) {
                        const price = parseFloat(updatedCosts[index].pricePerUnit || "0");
                        const quantity = parseFloat(e.target.value);
                        updatedCosts[index].total = calculateItemTotal(price, quantity);
                      }
                      
                      form.setValue("additionalCosts", updatedCosts);
                      updateTotalPrice();
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="text" 
                    placeholder="Total" 
                    value={cost.total || ""} 
                    readOnly 
                    className="bg-muted"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCost(index)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discount Type */}
        <FormField
          control={form.control}
          name="discountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount Type</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value)
                  updateTotalPrice()
                }} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Discount Value (conditional) */}
        {form.watch("discountType") !== "none" && (
          <FormField
            control={form.control}
            name="discountValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {form.watch("discountType") === "fixed" 
                    ? "Discount Amount" 
                    : "Discount Percentage"}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step={form.watch("discountType") === "fixed" ? "1" : "0.01"}
                    placeholder={
                      form.watch("discountType") === "fixed" 
                        ? "Enter discount amount" 
                        : "Enter discount percentage"
                    }
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      updateTotalPrice()
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Tax Toggle */}
        <FormField
          control={form.control}
          name="tax"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    updateTotalPrice()
                  }}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Apply Tax
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        
        {/* Tax Percentage (conditional) */}
        {form.watch("tax") && (
          <FormField
            control={form.control}
            name="taxPercentage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tax Percentage</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Enter tax percentage"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      updateTotalPrice()
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Total Price (read-only) */}
        <FormField
          control={form.control}
          name="totalPrice"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-lg">Total Price</FormLabel>
              <FormControl>
                <div className="bg-primary/5 border-2 border-primary rounded-md p-4 text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(field.value || "0"))}
                  </p>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
} 