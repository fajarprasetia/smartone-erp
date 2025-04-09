"use client"

import { useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Send } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"

// Form schema
const sendMessageSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits" })
    .regex(/^\+?[0-9]+$/, { message: "Phone number must contain only digits" }),
  templateId: z.string().min(1, { message: "Please select a template" }),
  templateParameters: z.array(z.string().optional()).optional(),
})

// Template interface
interface Template {
  id: string
  name: string
  parameterCount: number
}

// Mock templates
const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Welcome Message",
    parameterCount: 1,
  },
  {
    id: "2",
    name: "Order Confirmation",
    parameterCount: 3,
  },
  {
    id: "3",
    name: "Shipping Update",
    parameterCount: 4,
  },
  {
    id: "4",
    name: "Payment Reminder",
    parameterCount: 4,
  },
  {
    id: "5",
    name: "Feedback Request",
    parameterCount: 3,
  },
]

interface SendMessageFormProps {
  onSuccess?: () => void
}

export function SendMessageForm({ onSuccess }: SendMessageFormProps) {
  const [sending, setSending] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)

  // Initialize form
  const form = useForm<z.infer<typeof sendMessageSchema>>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: {
      phoneNumber: "",
      templateId: "",
      templateParameters: [],
    },
  })

  // Handle template selection
  const handleTemplateChange = (value: string) => {
    const template = mockTemplates.find((t) => t.id === value)
    setSelectedTemplate(template || null)
    
    // Reset parameters when template changes
    if (template) {
      const emptyParams = Array(template.parameterCount).fill("")
      form.setValue("templateParameters", emptyParams)
    } else {
      form.setValue("templateParameters", [])
    }
  }

  // Handle form submission
  async function onSubmit(data: z.infer<typeof sendMessageSchema>) {
    setSending(true)
    
    try {
      // In a real application, this would be an API call
      console.log("Sending message with data:", data)
      
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      toast.success("Message sent successfully!")
      
      // Reset form
      form.reset()
      setSelectedTemplate(null)
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send WhatsApp Message</CardTitle>
        <CardDescription>
          Send a message using one of your approved templates
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., +6281234567890"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the phone number with country code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Template</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleTemplateChange(value)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTemplate && selectedTemplate.parameterCount > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Template Parameters</h4>
                {Array.from({ length: selectedTemplate.parameterCount }).map((_, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`templateParameters.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parameter {index + 1}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={`Enter parameter ${index + 1}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <>
                  <Send className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

// Also export as default
export default SendMessageForm; 