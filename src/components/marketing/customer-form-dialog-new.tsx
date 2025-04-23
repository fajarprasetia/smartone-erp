'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  onClose: (refresh: boolean, newCustomerId?: string) => void
  isWhatsAppContact?: boolean
}

export function CustomerFormDialogNew({ open, customer, onClose, isWhatsAppContact = false }: CustomerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Track mounting state for client-side only code
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
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
        ? `/api/marketing/customers/${customer.id}` 
        : '/api/marketing/customers'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      // Get the response data early
      const responseData = await res.json();
      
      if (!res.ok) {
        const errorMessage = responseData.error || 'Failed to save customer'
        
        // Check if it's a phone number already exists error
        if (errorMessage.includes('phone number registered to')) {
          toast({
            title: 'Phone Number Already Exists',
            description: errorMessage,
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          })
        }
        
        throw new Error(errorMessage)
      }
      
      // Extract the customer ID from the response
      const customerId = responseData.id || (isEditing ? customer?.id : null);
      
      toast({
        title: isEditing ? 'Customer updated' : 'Customer added',
        description: isEditing 
          ? `${data.nama} has been updated successfully.` 
          : `${data.nama} has been added successfully.`,
      })
      
      // Pass the customer ID when closing the dialog
      onClose(true, customerId)
    } catch (error) {
      console.error('Error saving customer:', error)
      // Toast is already shown in the error handling above
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // If not mounted or not open, return nothing
  if (!mounted || !open) return null
  
  // Create a modal structure that works well with portals
  const ModalContent = (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onClose(false)}
      />
      
      {/* Centering container */}
      <div className="fixed inset-0 flex items-center justify-center">
        {/* Modal container */}
        <div className="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 overflow-auto max-h-[90vh]">
          {/* Header */}
          <div className="sticky top-0 bg-background border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onClose(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Form content */}
          <div className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter customer name" 
                          {...field} 
                        />
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
                        <Input 
                          placeholder="Enter phone number" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2 pt-4">
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
    </>
  );
  
  // Use portal to render outside of the DOM hierarchy
  return createPortal(ModalContent, document.getElementById('modal-root') || document.body);
}