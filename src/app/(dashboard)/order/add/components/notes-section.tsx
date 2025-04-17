"use client"

import { UseFormReturn } from "react-hook-form"
import { OrderFormValues } from "../schemas/order-form-schema"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"

interface NotesSectionProps {
  form: UseFormReturn<OrderFormValues>
}

export function NotesSection({
  form,
}: NotesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter additional notes or specific requirements for the order"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
} 