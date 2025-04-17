"use client"

import { UseFormReturn, FormProvider } from "react-hook-form"
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { OrderFormValues } from "../schemas/order-form-schema"
import { updateNotesWithProductTypes as updateNotesWithTypes } from "../utils/order-form-utils"

interface ProductTypeSectionProps {
  form: UseFormReturn<OrderFormValues>
  handleProductTypeChange: (type: string, checked: boolean) => void
  handleDTFPassChange: (pass: "4 PASS" | "6 PASS") => void
  updateNotesWithProductTypes?: (notes: string, productTypes: { [key: string]: boolean }, dtfPass?: string) => string
  setMultipleProductTypes?: (types: { [key: string]: boolean }) => void
}

export function ProductTypeSection({
  form,
  handleProductTypeChange,
  handleDTFPassChange,
  updateNotesWithProductTypes,
  setMultipleProductTypes,
}: ProductTypeSectionProps) {
  // Get the current dtf value from the form
  const isDtfSelected = form.watch("jenisProduk.DTF")
  
  // Get all product types for proper rendering
  const productTypes = form.watch("jenisProduk");
  console.log("Current product types:", productTypes);
  
  // Function to reset all product types and clear the DTF pass
  const handleClearAll = () => {
    // Reset all product types to false
    form.setValue("jenisProduk", {
      PRINT: false,
      PRESS: false,
      CUTTING: false,
      DTF: false,
      SEWING: false,
    });
    
    // Clear DTF pass selection
    form.setValue("dtfPass", undefined);
    
    // Update notes
    const currentNotes = form.getValues("notes") || "";
    const updatedNotes = updateNotesWithTypes(currentNotes, form.getValues("jenisProduk"), form.getValues("dtfPass"));
    form.setValue("notes", updatedNotes);
  };

  // Helper function to update notes with product types
  const updateNotes = () => {
    const currentNotes = form.getValues("notes") || "";
    const updatedNotes = updateNotesWithTypes(currentNotes, form.getValues("jenisProduk"), form.getValues("dtfPass"));
    form.setValue("notes", updatedNotes);
  };

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Product Type</h3>
      </div>
      
      {/* Shortcut Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (setMultipleProductTypes) {
              setMultipleProductTypes({
                PRINT: true,
                PRESS: true,
                CUTTING: false,
                DTF: false,
                SEWING: false,
              });
            } else {
              form.setValue("jenisProduk.PRINT", true);
              form.setValue("jenisProduk.PRESS", true);
              form.setValue("jenisProduk.CUTTING", false);
              form.setValue("jenisProduk.DTF", false);
              form.setValue("jenisProduk.SEWING", false);
              updateNotes();
            }
          }}
        >
          Print + Press
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (setMultipleProductTypes) {
              setMultipleProductTypes({
                PRINT: true,
                PRESS: true,
                CUTTING: true,
                DTF: false,
                SEWING: false,
              });
            } else {
              form.setValue("jenisProduk.PRINT", true);
              form.setValue("jenisProduk.PRESS", true);
              form.setValue("jenisProduk.CUTTING", true);
              form.setValue("jenisProduk.DTF", false);
              form.setValue("jenisProduk.SEWING", false);
              updateNotes();
            }
          }}
        >
          Print + Press + Cut
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (setMultipleProductTypes) {
              setMultipleProductTypes({
                PRINT: true,
                PRESS: true,
                CUTTING: true,
                DTF: false,
                SEWING: true,
              });
            } else {
              form.setValue("jenisProduk.PRINT", true);
              form.setValue("jenisProduk.PRESS", true);
              form.setValue("jenisProduk.CUTTING", true);
              form.setValue("jenisProduk.DTF", false);
              form.setValue("jenisProduk.SEWING", true);
              updateNotes();
            }
          }}
        >
          Full Order
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (setMultipleProductTypes) {
              setMultipleProductTypes({
                PRINT: false,
                PRESS: false,
                CUTTING: false,
                DTF: true,
                SEWING: false,
              });
            } else {
              form.setValue("jenisProduk.PRINT", false);
              form.setValue("jenisProduk.PRESS", false);
              form.setValue("jenisProduk.CUTTING", false);
              form.setValue("jenisProduk.DTF", true);
              form.setValue("jenisProduk.SEWING", false);
              if (!form.getValues("dtfPass")) {
                form.setValue("dtfPass", "4 PASS");
              }
              updateNotes();
            }
          }}
        >
          DTF Only
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* PRINT Checkbox */}
        <FormField
          control={form.control}
          name="jenisProduk.PRINT"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">PRINT</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleProductTypeChange("PRINT", !!checked)
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* PRESS Checkbox */}
        <FormField
          control={form.control}
          name="jenisProduk.PRESS"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">PRESS</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleProductTypeChange("PRESS", !!checked)
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* CUTTING Checkbox */}
        <FormField
          control={form.control}
          name="jenisProduk.CUTTING"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">CUTTING</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleProductTypeChange("CUTTING", !!checked)
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* DTF Checkbox */}
        <FormField
          control={form.control}
          name="jenisProduk.DTF"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">DTF</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleProductTypeChange("DTF", !!checked)
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* SEWING Checkbox */}
        <FormField
          control={form.control}
          name="jenisProduk.SEWING"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">SEWING</FormLabel>
              </div>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleProductTypeChange("SEWING", !!checked)
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {/* DTF Pass Type - Only shown when DTF is selected */}
      {isDtfSelected && (
        <FormField
          control={form.control}
          name="dtfPass"
          render={({ field }) => (
            <FormItem className="ml-4">
              <FormLabel>DTF Pass Type</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleDTFPassChange(value as "4 PASS" | "6 PASS");
                }}
                value={field.value || "4 PASS"}
              >
                <FormControl>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select DTF Pass" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="4 PASS">4 PASS</SelectItem>
                  <SelectItem value="6 PASS">6 PASS</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  )
} 