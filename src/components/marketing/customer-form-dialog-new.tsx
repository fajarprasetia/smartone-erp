'use client'

import React, { useState, useEffect } from 'react'
import { customer } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Form validation schema
const formSchema = z.object({
  nama: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  telp: z.string().refine(
    (val) => {
      // Allow empty string or valid phone number
      if (!val) return true;
      
      // Remove any leading 0 or 62
      const cleaned = val.replace(/^(0|62)/, '');
      
      // Check if it's a valid phone number (digits only)
      return /^\d+$/.test(cleaned);
    },
    { message: 'Please enter a valid phone number' }
  ),

})

type FormValues = z.infer<typeof formSchema>

interface CustomerFormDialogProps {
  open: boolean
  customer: customer | null
  onClose: (refresh: boolean) => void
  isWhatsAppContact?: boolean
}

export function CustomerFormDialogNew({ open, customer, onClose, isWhatsAppContact = false }: CustomerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  
  const isEditing = !!customer
  
  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      telp: '',
    },
  })
  
  // Reset form with customer data when dialog opens or customer changes
  useEffect(() => {
    if (open && customer) {
      form.reset({
        nama: customer.nama || '',
        telp: customer.telp || '',
      })
    } else if (open) {
      form.reset({
        nama: '',
        telp: '',
      })
    }
  }, [open, customer, form])
  
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)
      
      // Format phone number for storage (remove leading 0 or 62 prefix)
      const phoneForStorage = data.telp ? data.telp.replace(/^(0|62)/, '') : ''
      
      const payload = {
        ...data,
        telp: phoneForStorage,
      }
      
      // Using the new API endpoints
      const url = isEditing 
        ? `/api/marketing/customers-new/${customer.id}` 
        : '/api/marketing/customers-new'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        throw new Error('Failed to save customer')
      }
      
      toast({
        title: isEditing ? 'Customer updated' : 'Customer added',
        description: isEditing 
          ? `${data.nama} has been updated successfully.` 
          : `${data.nama} has been added successfully.`,
      })
      
      onClose(true) // Close dialog and refresh data
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: 'Error',
        description: 'Failed to save customer. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onClose(false)}
      />

      {/* Modal */}
      <div className="bg-background z-50 rounded-lg border shadow-lg w-full max-w-lg mx-4 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEditing 
                ? 'Update customer details below' 
                : 'Fill in the required information to add a new customer'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClose(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder={isEditing ? customer.nama || 'Enter customer name' : 'Enter customer name'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder={isEditing ? customer.telp || 'Enter phone number' : 'Enter phone number'} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

              <div
                className={cn(
                  "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4"
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onClose(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting 
                    ? 'Saving...' 
                    : (isEditing ? 'Save Changes' : 'Add Customer')}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}