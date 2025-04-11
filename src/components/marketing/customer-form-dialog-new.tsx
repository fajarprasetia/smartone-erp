'use client'

import React, { useState, useEffect } from 'react'
import { Customer } from '@prisma/client'
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
  email: z.string().email({ message: 'Please enter a valid email' }).optional().or(z.literal('')),
  address: z.string().optional(),
  status: z.string().optional(),
  tags: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CustomerFormDialogProps {
  open: boolean
  customer: Customer | null
  onClose: (refresh: boolean) => void
  isWhatsAppContact?: boolean
}

export function CustomerFormDialogNew({ open, customer, onClose, isWhatsAppContact = false }: CustomerFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  
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
      email: '',
      address: '',
      status: 'UNVERIFIED',
      tags: '',
    },
  })
  
  // Reset form when dialog opens or customer changes
  useEffect(() => {
    if (open) {
      if (customer) {
        // Format phone number for display
        const phoneForDisplay = customer.telp || ''
        
        form.reset({
          nama: customer.nama,
          telp: phoneForDisplay,
          email: customer.email || '',
          address: customer.address || '',
          status: customer.status || 'UNVERIFIED',
          tags: '',
        })
      } else {
        form.reset({
          nama: '',
          telp: '',
          email: '',
          address: '',
          status: 'UNVERIFIED',
          tags: '',
        })
      }
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="additional">Additional Info</TabsTrigger>
                </TabsList>
                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nama"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
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
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="additional" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UNVERIFIED">Unverified</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tags (comma separated)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

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