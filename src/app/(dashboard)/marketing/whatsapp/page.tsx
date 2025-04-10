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
import { formatNumber } from "@/lib/utils"
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
  
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageFormSchema),
    defaultValues: {
      recipient: "",
      message: "",
    },
  });

  const onSubmit = async (data: MessageFormValues) => {
    try {
      setIsLoading(true)
      
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message
      toast.success("Message sent successfully")
      
      // Reset form and close dialog
      form.reset()
      onOpenChange(false)
      
      // Redirect to detailed messaging interface
      router.push("/marketing/whatsapp/message-send")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!open) return null
  
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
              <FormField
                control={form.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number (e.g. 628123456789)" {...field} className="bg-background/50 border-border/40" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                  disabled={isLoading}
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
                    router.push("/marketing/whatsapp/message-send")
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
  // In a real app, these stats would come from an API
  const stats = {
    totalMessages: 1237,
    deliveryRate: 98.5,
    readRate: 76.2,
    activeTemplates: 5,
    contacts: 472,
  }
  
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Business Platform</h2>
        <p className="text-muted-foreground">
          Manage your WhatsApp business messaging, templates, and contacts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-background/70 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
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
                <div className="text-2xl font-bold mt-1">{formatNumber(stats.totalMessages)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Delivery Rate</div>
                <div className="text-2xl font-bold mt-1">{stats.deliveryRate}%</div>
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

        <Card className="bg-background/70 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
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
                <div className="text-2xl font-bold mt-1">{stats.activeTemplates}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Read Rate</div>
                <div className="text-2xl font-bold mt-1">{stats.readRate}%</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-background/90 backdrop-blur-sm hover:bg-background/80 border-border/40">
              <Link href="/marketing/whatsapp/templates">
                Manage Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-background/70 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
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
                <div className="text-2xl font-bold mt-1">{formatNumber(stats.contacts)}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-background/90 backdrop-blur-sm hover:bg-background/80 border-border/40">
              <Link href="/marketing/customer">
                Manage Contacts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-background/70 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <BarChart className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>WhatsApp Analytics</CardTitle>
            <CardDescription>
              Performance metrics for your WhatsApp messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Analytics dashboard coming soon</p>
          </CardContent>
        </Card>

        <Card className="bg-background/70 dark:bg-background/40 backdrop-blur-xl backdrop-saturate-150 border-border/40 hover:shadow-primary/5 hover:border-border/60 transition-all duration-300">
          <CardHeader>
            <Settings className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="text-muted-foreground">
                Configure your WhatsApp Business API settings, including API keys and webhooks.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-background/90 backdrop-blur-sm hover:bg-background/80 border-border/40">
              <Link href="/settings/whatsapp">
                Configure Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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