"use client"

import { Suspense } from 'react'
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState, useEffect } from 'react'
import { Customer } from '@prisma/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Search, Plus, Pencil, Trash2, MessageSquare } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

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
});

type FormValues = z.infer<typeof formSchema>

type CustomerWithFormatting = Customer & {
  formattedPhone: string
}

function IntegratedCustomerTableNew() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerWithFormatting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      telp: '',
      email: '',
      address: ''
    },
  });
  
  // Reset form when dialog opens or customer changes
  useEffect(() => {
    if (isDialogOpen) {
      if (selectedCustomer) {
        form.reset({
          nama: selectedCustomer.nama || '',
          telp: selectedCustomer.telp || '',
          email: selectedCustomer.email || '',
          address: selectedCustomer.address || ''
        });
      } else {
        form.reset({
          nama: '',
          telp: '',
          email: '',
          address: ''
        });
      }
    }
  }, [isDialogOpen, selectedCustomer, form]);
  
  // Load customers
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/marketing/customers', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch customers');
        
        const data = await res.json();
        const formattedData = data.map((customer: Customer) => ({
          ...customer,
          formattedPhone: customer.telp ? `62${customer.telp}` : ''
        }));
        
        setCustomers(formattedData);
      } catch (error) {
        console.error('Error loading customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customers.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCustomers();
  }, []);
  
  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    return (
      customer.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.formattedPhone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Submit form handler
  const onSubmit = async (data: FormValues) => {
    try {
      // Process phone number - remove leading 0 or 62
      const processedTelp = data.telp ? data.telp.replace(/^(0|62)/, '') : '';
      
      const payload = {
        ...data,
        telp: processedTelp
      };
      
      const url = selectedCustomer 
        ? `/api/marketing/customers/${selectedCustomer.id}` 
        : '/api/marketing/customers';
      
      const method = selectedCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to save customer');
      
      // Get the updated/new customer
      const savedCustomer = await res.json();
      
      // Update local state
      if (selectedCustomer) {
        setCustomers(prev => prev.map(c => 
          c.id === selectedCustomer.id 
            ? { ...savedCustomer, formattedPhone: savedCustomer.telp ? `62${savedCustomer.telp}` : '' } 
            : c
        ));
      } else {
        setCustomers(prev => [
          ...prev, 
          { ...savedCustomer, formattedPhone: savedCustomer.telp ? `62${savedCustomer.telp}` : '' }
        ]);
      }
      
      // Close dialog and reset selection
      setIsDialogOpen(false);
      setSelectedCustomer(null);
      
      toast({
        title: selectedCustomer ? 'Customer Updated' : 'Customer Added',
        description: `${data.nama} has been ${selectedCustomer ? 'updated' : 'added'} successfully.`
      });
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: "Error",
        description: "Failed to save customer data.",
        variant: "destructive"
      });
    }
  };
  
  // Handle WhatsApp click
  const handleWhatsAppClick = (telp: string) => {
    if (!telp) {
      toast({
        title: "No phone number",
        description: "This customer doesn't have a phone number.",
        variant: "destructive"
      });
      return;
    }
    
    // Format phone number for WhatsApp API
    const formattedPhone = telp.startsWith('62') ? telp : `62${telp}`;
    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}`, '_blank');
  };
  
  // Handle edit click
  const handleEditClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };
  
  // Handle delete click
  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        const res = await fetch(`/api/marketing/customers/${id}`, {
          method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Failed to delete customer');
        
        // Update local state
        setCustomers(prev => prev.filter(c => c.id !== id));
        
        toast({
          title: "Customer Deleted",
          description: "The customer has been deleted successfully."
        });
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast({
          title: "Error",
          description: "Failed to delete customer.",
          variant: "destructive"
        });
      }
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={() => {
          setSelectedCustomer(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading customers...</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.nama}</TableCell>
                    <TableCell>{customer.formattedPhone || 'N/A'}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleWhatsAppClick(customer.telp || '')}
                          title="Open WhatsApp chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(customer)}
                          title="Edit customer"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(customer.id)}
                          title="Delete customer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Customer Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
        <DialogContent className="max-w-md top-[20%] translate-y-0">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer ? 'Update customer information.' : 'Add a new customer to your database.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer name" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Phone number (e.g. 81234567 or 6281234567)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Email address (optional)" 
                        type="email"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="Address (optional)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedCustomer ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerNewPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">
            Manage all your customers including WhatsApp contacts in one place
          </p>
        </div>
      </div>
      
      <Card className="p-6">
        <Suspense fallback={<div>Loading customers...</div>}>
          <IntegratedCustomerTableNew />
        </Suspense>
      </Card>
    </div>
  )
} 