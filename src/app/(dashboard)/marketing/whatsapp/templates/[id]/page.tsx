"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Clock, Pencil, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

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

// Status badge component
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "APPROVED":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="mr-1 h-3 w-3" /> Approved
        </Badge>
      )
    case "REJECTED":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="mr-1 h-3 w-3" /> Rejected
        </Badge>
      )
    case "PENDING":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      )
    default:
      return null
  }
}

// Format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

export default function TemplateViewPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real application, you would fetch the template from your API
    // const fetchTemplate = async () => {
    //   try {
    //     const response = await fetch(`/api/whatsapp/templates/${params.id}`)
    //     if (!response.ok) throw new Error('Failed to fetch template')
    //     const data = await response.json()
    //     setTemplate(data)
    //   } catch (error) {
    //     toast.error("Failed to load template")
    //     router.push("/marketing/whatsapp/templates")
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // fetchTemplate()

    // Using mock data for now
    const templateId = Array.isArray(params.id) ? params.id[0] : params.id
    const mockTemplate = mockTemplates[templateId]
    
    if (mockTemplate) {
      setTemplate(mockTemplate)
    } else {
      toast.error("Template not found")
      router.push("/marketing/whatsapp/templates")
    }
    
    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{template.name}</h2>
          <p className="text-muted-foreground">{template.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template Information */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <StatusBadge status={template.status} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created On</h3>
              <p>{formatDate(template.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Template ID</h3>
              <p className="text-sm font-mono">{template.id}</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/marketing/whatsapp/templates/${template.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edit Template
            </Button>
          </CardFooter>
        </Card>

        {/* Template Preview */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
            <CardDescription>
              Preview of how your template will appear in WhatsApp messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-[#e5f7d3] rounded-lg p-4 max-w-md mx-auto shadow">
              {/* Header */}
              {template.header && (
                <>
                  <div className="font-medium mb-2">{template.header.text}</div>
                  <Separator className="my-2 bg-green-200" />
                </>
              )}
              
              {/* Body */}
              <div className="whitespace-pre-line mb-2">
                {template.body.example}
              </div>
              
              {/* Footer */}
              {template.footer && (
                <>
                  <Separator className="my-2 bg-green-200" />
                  <div className="text-xs text-gray-500 italic">
                    {template.footer.text}
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

        {/* Template Variables */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Template Structure</CardTitle>
            <CardDescription>
              The structure of your template including variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Header Section */}
              {template.header && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Header</h3>
                  <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-800">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Format:</span>{" "}
                      <span>{template.header.format}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Text:</span>{" "}
                      <span>{template.header.text}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Body Section */}
              <div>
                <h3 className="text-lg font-medium mb-2">Body</h3>
                <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-800">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Text:</span>{" "}
                    <span className="whitespace-pre-line">{template.body.text}</span>
                  </div>
                </div>
              </div>

              {/* Footer Section */}
              {template.footer && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Footer</h3>
                  <div className="bg-gray-50 p-4 rounded-md dark:bg-gray-800">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Text:</span>{" "}
                      <span>{template.footer.text}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 