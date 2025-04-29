"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function NewTemplatePage() {
  const router = useRouter()
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

  // Handle form submission
  async function onSubmit(data: TemplateFormValues) {
    setSaving(true)
    
    try {
      // In a real application, you would send the data to your API
      // await fetch(`/api/whatsapp/templates`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(data),
      // })
      
      // Mock success response
      setTimeout(() => {
        toast.success("Template created successfully")
        setSaving(false)
        router.push("/marketing/whatsapp/templates")
      }, 1000)
    } catch (error) {
      toast.error("Failed to create template")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Create New Template</h2>
          <p className="text-muted-foreground">
            Create a new WhatsApp message template
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
                            <Input placeholder={"e.g., Order Confirmation"} {...field} />
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
                            placeholder={"e.g., Hello {{1}}, your order #{{2}} has been confirmed."}
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The main content of your message. Use {"{{"} and {"}}"}  for variables (e.g., {"{{"} 1 {"}}"}  ).
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
                            placeholder={"e.g., Hello John, your order #12345 has been confirmed."}
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
                            placeholder={"e.g., Thank you for choosing SmartOne ERP"}
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Create Template
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