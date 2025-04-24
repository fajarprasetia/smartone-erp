"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  MessageSquare, 
  Users, 
  Settings, 
  FileText, 
  BarChart, 
  ArrowRight,
  Send,
  X
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"

// Define message form schema
const messageFormSchema = z.object({
  recipient: z.string().min(1, "Recipient is required"),
  message: z.string().min(1, "Message is required").max(1000, "Message cannot exceed 1000 characters"),
});

type MessageFormValues = z.infer<typeof messageFormSchema>;

// MessageSendDialog component
function MessageSendDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<{id: string, nama: string, telp: string}[]>([])
  const [customerSearchQuery, setCustomerSearchQuery] = useState("")
  
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
  
  // Fetch customers when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCustomers = async () => {
        try {
          const res = await fetch('/api/marketing/customers', { cache: 'no-store' });
          
          if (!res.ok) {
            throw new Error('Failed to fetch customers');
          }
          
          const data = await res.json();
          // Only include customers with phone numbers
          const customersWithPhone = data.filter((customer: any) => customer.telp);
          setCustomers(customersWithPhone);
        } catch (error) {
          console.error("Error fetching customers:", error);
          toast.error("Failed to load customers");
        }
      };
      
      fetchCustomers();
    }
  }, [open]);
  
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipient: "",
      message: "",
    },
  });

  const onSubmit = async (data: MessageFormValues) => {
    if (!customerId) {
      toast.error("Please select a recipient");
      return;
    }
    
    try {
      setIsLoading(true)
      
      // Send message using the WhatsApp API
      const response = await fetch('/api/marketing/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId,
          message: data.message,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send message: ${errorData}`);
      }
      
      // Get response data
      await response.json();
      
      // Show success message
      toast.success("Message sent successfully")
      
      // Reset form and close dialog
      form.reset()
      setCustomerId(null)
      onOpenChange(false)
      
      // Redirect to detailed messaging interface with the customer selected
      router.push(`/marketing/whatsapp/chat?contact=${customerId}`)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Filter customers based on search query
  const filteredCustomers = customerSearchQuery
    ? customers.filter(customer => 
        customer.nama.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        customer.telp.includes(customerSearchQuery)
      )
    : customers;
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-md mx-4 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40">
          <div>
            <h2 className="text-lg font-semibold">Send WhatsApp Message</h2>
            <p className="text-sm text-muted-foreground">
              Send a quick message or use the full messaging interface
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient</label>
                <div className="relative">
                  <Input 
                    placeholder="Search by name or phone number"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="bg-background/50 border-border/40"
                  />
                </div>
                <div className="mt-2 max-h-40 overflow-y-auto bg-background/50 rounded-md border border-border/40">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No customers found
                    </div>
                  ) : (
                    filteredCustomers.map(customer => (
                      <div 
                        key={customer.id}
                        className={cn(
                          "p-2 cursor-pointer hover:bg-primary/10 flex justify-between text-sm",
                          customerId === customer.id && "bg-primary/10"
                        )}
                        onClick={() => setCustomerId(customer.id)}
                      >
                        <div className="font-medium">{customer.nama}</div>
                        <div className="text-muted-foreground">{customer.telp}</div>
                      </div>
                    ))
                  )}
                </div>
                {form.formState.errors.recipient && (
                  <p className="text-sm text-destructive">{form.formState.errors.recipient.message}</p>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Type your message here..." 
                        className="min-h-[100px] bg-background/50 border-border/40"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-y-2">
                <Button 
                  type="submit" 
                  disabled={isLoading || !customerId}
                  className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary"
                >
                  {isLoading ? "Sending..." : "Send Message"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border/40 bg-background/50"
                  onClick={() => {
                    onOpenChange(false)
                    router.push("/marketing/whatsapp/chat")
                  }}
                >
                  Open Full Messaging Interface
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  )
}

export default function WhatsAppDashboardPage() {
  // State for stats data
  const [stats, setStats] = useState({
    totalMessages: 0,
    deliveryRate: 0,
    readRate: 0,
    activeTemplates: 0,
    contacts: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Fetch real stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch WhatsApp configuration status
        try {
          const configResponse = await fetch('/api/settings/whatsapp/status', { 
            cache: 'no-store'
          });
          
          if (configResponse.ok) {
            const configData = await configResponse.json();
            setConnectionStatus(configData.status || 'disconnected');
          } else {
            setConnectionStatus('disconnected');
          }
        } catch (configErr) {
          console.error('Error fetching WhatsApp config:', configErr);
          setConnectionStatus('disconnected');
        }
        
        // Fetch WhatsApp stats
        const response = await fetch('/api/marketing/whatsapp/stats', { 
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch WhatsApp statistics');
        }
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching WhatsApp stats:', err);
        setError('Failed to load statistics. Please try again later.');
        // Fallback to zeros for all stats
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  // Loading indicator function
  const StatSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-6 w-16 bg-primary/10 rounded mb-1"></div>
      <div className="h-8 w-20 bg-primary/20 rounded"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Business Platform</h2>
        <p className="text-muted-foreground">
          Manage your WhatsApp business messaging, templates, and contacts
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-background/10 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Messaging</CardTitle>
            <CardDescription>
              Send template-based messages to your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Messages</div>
                {isLoading ? (
                  <StatSkeleton />
                ) : (
                  <div className="text-2xl font-bold mt-1">{stats.totalMessages}</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground">Delivery Rate</div>
                {isLoading ? (
                  <StatSkeleton />
                ) : (
                  <div className="text-2xl font-bold mt-1">{stats.deliveryRate}%</div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary" onClick={() => setIsMessageDialogOpen(true)}>
              Send Messages
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-background/10 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Manage your message templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Active Templates</div>
                {isLoading ? (
                  <StatSkeleton />
                ) : (
                  <div className="text-2xl font-bold mt-1">{stats.activeTemplates}</div>
                )}
              </div>
              <div>
                <div className="text-muted-foreground">Read Rate</div>
                {isLoading ? (
                  <StatSkeleton />
                ) : (
                  <div className="text-2xl font-bold mt-1">{stats.readRate}%</div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary">
              <Link href="/marketing/whatsapp/templates">
                Manage Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-background/10 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Manage your WhatsApp customer contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Contacts</div>
                {isLoading ? (
                  <StatSkeleton />
                ) : (
                  <div className="text-2xl font-bold mt-1">{stats.contacts}</div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary/90 backdrop-blur-sm hover:bg-primary">
              <Link href="/marketing/customer">
                Manage Contacts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-background/10 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <BarChart className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>WhatsApp Analytics</CardTitle>
            <CardDescription>
              Performance metrics for your WhatsApp messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            {isLoading ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="animate-pulse flex space-x-4 w-3/4 h-8 bg-primary/10 rounded"></div>
                <div className="animate-pulse flex space-x-4 w-full h-24 bg-primary/5 rounded"></div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Analytics dashboard in development</p>
                <div className="flex justify-center gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Messages</div>
                    <div className="text-xl font-bold">{stats.totalMessages}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Delivery</div>
                    <div className="text-xl font-bold">{stats.deliveryRate}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Read Rate</div>
                    <div className="text-xl font-bold">{stats.readRate}%</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/10 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <Settings className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Connection Status:</span>
                {isLoading ? (
                  <div className="animate-pulse w-20 h-6 bg-primary/10 rounded"></div>
                ) : (
                  <div className="flex items-center">
                    <span className={cn(
                      "h-2 w-2 rounded-full mr-2",
                      connectionStatus === 'connected' ? "bg-green-500" : 
                      connectionStatus === 'connecting' ? "bg-amber-500" : "bg-red-500"
                    )}></span>
                    <span className={cn(
                      "font-medium",
                      connectionStatus === 'connected' ? "text-green-500" : 
                      connectionStatus === 'connecting' ? "text-amber-500" : "text-destructive"
                    )}>
                      {connectionStatus === 'connected' ? 'Connected' : 
                       connectionStatus === 'connecting' ? 'Connecting' : 'Disconnected'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
              <p className="text-muted-foreground">
                Ask System Administrator for help
              </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Message Send Dialog */}
      <MessageSendDialog 
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
      />
    </div>
  )
}