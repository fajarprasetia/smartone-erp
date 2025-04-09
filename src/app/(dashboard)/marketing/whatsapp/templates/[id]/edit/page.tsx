"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Template type definition
interface Template {
  id: string
  name: string
  description: string
  status: string
  createdAt: string
  header?: {
    format: string
    text?: string
    example?: string
  }
  body: {
    text: string
    example: string
  }
  footer?: {
    text: string
  }
}

// Mock template data
const mockTemplates: Record<string, Template> = {
  "1": {
    id: "1",
    name: "Welcome Message",
    description: "Sent to new customers upon registration",
    status: "APPROVED",
    createdAt: "2023-10-15T14:30:00Z",
    body: {
      text: "Hello {{1}}, welcome to SmartOne ERP! We're excited to have you on board. If you have any questions, please don't hesitate to reach out to our support team.",
      example: "Hello John, welcome to SmartOne ERP! We're excited to have you on board. If you have any questions, please don't hesitate to reach out to our support team."
    },
    footer: {
      text: "SmartOne ERP - Enhance Your Business Efficiency"
    }
  },
  "2": {
    id: "2",
    name: "Order Confirmation",
    description: "Sent when an order is confirmed",
    status: "APPROVED",
    createdAt: "2023-11-20T09:15:00Z",
    header: {
      format: "TEXT",
      text: "Order Confirmed",
    },
    body: {
      text: "Hi {{1}}, your order #{{2}} has been confirmed and is now being processed. Estimated delivery: {{3}}. Thank you for choosing SmartOne!",
      example: "Hi Maria, your order #12345 has been confirmed and is now being processed. Estimated delivery: 24-04-2024. Thank you for choosing SmartOne!"
    },
    footer: {
      text: "For any questions about your order, please contact us."
    }
  },
  "3": {
    id: "3",
    name: "Shipping Update",
    description: "Notifies customers about shipping status",
    status: "PENDING",
    createdAt: "2024-01-05T11:45:00Z",
    header: {
      format: "TEXT",
      text: "Shipping Update",
    },
    body: {
      text: "Hello {{1}}, your order #{{2}} has been shipped! You can track your package using the following tracking number: {{3}}. Expected delivery date: {{4}}.",
      example: "Hello Alex, your order #54321 has been shipped! You can track your package using the following tracking number: TRK987654321. Expected delivery date: 25-04-2024."
    }
  },
  "4": {
    id: "4",
    name: "Payment Reminder",
    description: "Reminder for pending payments",
    status: "REJECTED",
    createdAt: "2024-02-10T16:20:00Z",
    body: {
      text: "Hi {{1}}, this is a friendly reminder that your payment of {{2}} for order #{{3}} is due on {{4}}. Please complete your payment to avoid any service interruptions.",
      example: "Hi Thomas, this is a friendly reminder that your payment of Rp. 2.5JT for order #67890 is due on 30-04-2024. Please complete your payment to avoid any service interruptions."
    },
    footer: {
      text: "If you've already made the payment, please disregard this message."
    }
  },
  "5": {
    id: "5",
    name: "Feedback Request",
    description: "Request for customer feedback after delivery",
    status: "APPROVED",
    createdAt: "2024-03-25T13:10:00Z",
    header: {
      format: "TEXT",
      text: "Your Feedback Matters!",
    },
    body: {
      text: "Hello {{1}}, thank you for your recent purchase (Order #{{2}}). We'd love to hear your thoughts! Please take a moment to share your experience by clicking on the link below: {{3}}",
      example: "Hello Sarah, thank you for your recent purchase (Order #45678). We'd love to hear your thoughts! Please take a moment to share your experience by clicking on the link below: https://feedback.smartone.com/s/12345"
    },
    footer: {
      text: "Your feedback helps us improve our products and services."
    }
  }
}

// Form schema
const templateFormSchema = z.object({
  name: z.string().min(3, {
    message: "Template name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  header: z.object({
    format: z.enum(["TEXT", "NONE"]),
    text: z.string().optional(),
  }).optional(),
  body: z.object({
    text: z.string().min(10, {
      message: "Body text must be at least 10 characters.",
    }),
    example: z.string().min(10, {
      message: "Example text must be at least 10 characters.",
    }),
  }),
  footer: z.object({
    text: z.string().optional(),
  }).optional(),
})

type TemplateFormValues = z.infer<typeof templateFormSchema>

export default function EditTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Initialize form with default values
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      header: {
        format: "NONE",
        text: "",
      },
      body: {
        text: "",
        example: "",
      },
      footer: {
        text: "",
      },
    },
  })

  // Fetch template data
  useEffect(() => {
    const templateId = Array.isArray(params.id) ? params.id[0] : params.id
    const mockTemplate = mockTemplates[templateId]
    
    if (mockTemplate) {
      // Populate form with template data
      form.reset({
        name: mockTemplate.name,
        description: mockTemplate.description,
        header: mockTemplate.header || { format: "NONE", text: "" },
        body: {
          text: mockTemplate.body.text,
          example: mockTemplate.body.example,
        },
        footer: mockTemplate.footer || { text: "" },
      })
    } else {
      toast.error("Template not found")
      router.push("/marketing/whatsapp/templates")
    }
    
    setLoading(false)
  }, [params.id, router, form])

  // Handle form submission
  async function onSubmit(data: TemplateFormValues) {
    setSaving(true)
    
    try {
      // In a real application, you would send the data to your API
      // await fetch(`/api/whatsapp/templates/${params.id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // })
      
      // Mock success response
      setTimeout(() => {
        toast.success("Template updated successfully")
        setSaving(false)
        router.push(`/marketing/whatsapp/templates/${params.id}`)
      }, 1000)
    } catch (error) {
      toast.error("Failed to update template")
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Template</h2>
          <p className="text-muted-foreground">
            Update your WhatsApp message template
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <CardDescription>
                  Basic information about your template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Order Confirmation" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for your template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Sent to customers when an order is confirmed"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Briefly describe when and how this template will be used
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How your template will look when sent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-[#e5f7d3] rounded-lg p-4 h-60 overflow-auto shadow">
                  {/* Header */}
                  {form.watch("header.format") === "TEXT" && form.watch("header.text") && (
                    <>
                      <div className="font-medium mb-2">{form.watch("header.text")}</div>
                      <Separator className="my-2 bg-green-200" />
                    </>
                  )}
                  
                  {/* Body */}
                  <div className="whitespace-pre-line mb-2">
                    {form.watch("body.example") || "Enter example text to preview..."}
                  </div>
                  
                  {/* Footer */}
                  {form.watch("footer.text") && (
                    <>
                      <Separator className="my-2 bg-green-200" />
                      <div className="text-xs text-gray-500 italic">
                        {form.watch("footer.text")}
                      </div>
                    </>
                  )}
                  
                  {/* Timestamp */}
                  <div className="text-xs text-right mt-2 text-gray-500">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>
                Define the structure and content of your template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="header" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="header">Header (Optional)</TabsTrigger>
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="footer">Footer (Optional)</TabsTrigger>
                </TabsList>
                
                {/* Header Tab */}
                <TabsContent value="header" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="header.format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Header Format</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select header format" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NONE">No Header</SelectItem>
                            <SelectItem value="TEXT">Text</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of header for your template
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {form.watch("header.format") === "TEXT" && (
                    <FormField
                      control={form.control}
                      name="header.text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Text</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Order Confirmation" {...field} />
                          </FormControl>
                          <FormDescription>
                            Text to be displayed in the header section
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
                
                {/* Body Tab */}
                <TabsContent value="body" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="body.text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Hello {{1}}, your order #{{2}} has been confirmed."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The main content of your message. Use {{n}} for variables.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="body.example"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Example Text</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Hello John, your order #12345 has been confirmed."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          An example of how the template will look with real values
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {/* Footer Tab */}
                <TabsContent value="footer" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="footer.text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Footer Text</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Thank you for choosing SmartOne ERP"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional text to be displayed at the bottom of the message
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-2"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Template
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  )
} 