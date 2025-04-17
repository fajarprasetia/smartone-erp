import { UseFormReturn } from "react-hook-form"
import { updateNotesWithProductTypes } from "../utils/order-form-utils"
import { OrderFormValues } from "../schemas/order-form-schema"

export function useProductTypes(form: UseFormReturn<OrderFormValues>) {
  // Handle product type change (PRINT, PRESS, CUTTING, DTF, SEWING)
  const handleProductTypeChange = (type: string, checked: boolean) => {
    const currentValues = form.getValues("jenisProduk")
    
    // Special case for clearing - check if all values will be false after this change
    const willAllBeCleared = type === 'DTF' && !checked && 
      Object.entries(currentValues)
        .filter(([key]) => key !== 'DTF')
        .every(([_, value]) => !value)
        
    const isAnyOtherChecked = Object.entries(currentValues)
      .filter(([key]) => key !== 'DTF')
      .some(([_, value]) => value)
      
    const isDtfChecked = currentValues.DTF
    
    if (type === 'DTF' && checked) {
      // If DTF is checked, uncheck all other product types
      form.setValue("jenisProduk", {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: true,
        SEWING: false,
      })
      
      // Set default DTF pass if not already set
      if (!form.getValues("dtfPass")) {
        form.setValue("dtfPass", "4 PASS")
      }
      
      // Update notes with DTF pass
      updateNotes()
    } else if (type !== 'DTF' && checked) {
      // If any other type is checked, uncheck DTF
      form.setValue("jenisProduk.DTF", false)
      form.setValue("dtfPass", undefined)
      
      // Update notes with product types
      updateNotes()
    } else if (willAllBeCleared || 
              (Object.values(form.getValues("jenisProduk")).every(val => !val))) {
      // If we're clearing the last checkbox, reset the form
      console.log("All product types cleared, resetting restrictions")
      
      // Reset dtfPass when DTF is unchecked
      if (type === 'DTF') {
        form.setValue("dtfPass", undefined)
      }
      
      // This ensures we're not accidentally locking all checkboxes when clearing all product types
      form.setValue("jenisProduk", {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: false,
        SEWING: false,
      })
      
      // Update notes to remove product type information
      updateNotes()
    }
  }
  
  // Update notes with current product type information
  const updateNotes = () => {
    const currentJenisProduk = form.getValues("jenisProduk")
    const currentNotes = form.getValues("notes") || ""
    const dtfPass = form.getValues("dtfPass")
    
    const updatedNotes = updateNotesWithProductTypes(
      currentJenisProduk,
      dtfPass,
      currentNotes
    )
    
    form.setValue("notes", updatedNotes)
  }
  
  return {
    handleProductTypeChange,
    updateNotes
  }
} 