"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define the template schema with validation
const templateSchema = z.object({
  name: z.string().min(3, {
    message: "Template name must be at least 3 characters.",
  }).max(50, {
    message: "Template name must not exceed 50 characters."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }).max(200, {
    message: "Description must not exceed 200 characters."
  }),
  components: z.array(
    z.object({
      type: z.enum(["HEADER", "BODY", "FOOTER"]),
      text: z.string().min(1, {
        message: "Component text is required."
      }).max(1024, {
        message: "Component text must not exceed 1024 characters."
      }),
    })
  ).min(1, {
    message: "At least one component is required."
  }),
})

// Type for the form values based on the schema
type TemplateFormValues = z.infer<typeof templateSchema>

// Default values for a new template
const defaultValues: Partial<TemplateFormValues> = {
  name: "",
  description: "",
  components: [
    {
      type: "HEADER",
      text: "",
    },
    {
      type: "BODY",
      text: "",
    },
    {
      type: "FOOTER",
      text: "SmartOne ERP - Your Business Solution",
    }
  ],
}

interface TemplateFormProps {
  initialData?: any
  isEditing?: boolean
}

export function TemplateForm({
  initialData,
  isEditing = false,
}: TemplateFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialize the form with default values or initial data if editing
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || defaultValues,
  })

  // Handle form submission
  async function onSubmit(data: TemplateFormValues) {
    try {
      setIsLoading(true)
      
      // This would be replaced with an actual API call
      console.log("Form data:", data)
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(isEditing ? "Template updated successfully!" : "Template created successfully!")
      
      // Redirect to templates list
      router.push("/marketing/whatsapp/templates")
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new component to the template
  const addComponent = () => {
    const components = form.getValues("components") || []
    
    // Check if we already have all required components
    const hasHeader = components.some(c => c.type === "HEADER")
    const hasBody = components.some(c => c.type === "BODY")
    const hasFooter = components.some(c => c.type === "FOOTER")
    
    // Determine which component type to add
    let newType: "HEADER" | "BODY" | "FOOTER" = "BODY"
    
    if (!hasHeader) {
      newType = "HEADER"
    } else if (!hasBody) {
      newType = "BODY"
    } else if (!hasFooter) {
      newType = "FOOTER"
    }
    
    // Add the new component
    form.setValue("components", [
      ...components,
      {
        type: newType,
        text: "",
      }
    ])
  }

  // Remove a component from the template
  const removeComponent = (index: number) => {
    const components = form.getValues("components") || []
    
    // Ensure we don't remove all components
    if (components.length <= 1) {
      toast.error("At least one component is required.")
      return
    }
    
    // Remove the component at the specified index
    form.setValue("components", components.filter((_, i) => i !== index))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Template" : "Create New Template"}</CardTitle>
        <CardDescription>
          {isEditing 
            ? "Update your WhatsApp message template details." 
            : "Create a new WhatsApp message template to send to your customers."}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Order Confirmation" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      A short, descriptive name for your template.
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
                        placeholder="Template purpose and usage details..." 
                        className="resize-none" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe how and when this template will be used.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Template Components</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addComponent}
                  disabled={isLoading}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              </div>
              
              <div className="space-y-6">
                {form.watch("components")?.map((_, index) => (
                  <div key={index} className="p-4 border rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <FormField
                        control={form.control}
                        name={`components.${index}.type`}
                        render={({ field }) => (
                          <FormItem className="flex-1 max-w-[200px]">
                            <FormLabel>Component Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="HEADER">Header</SelectItem>
                                <SelectItem value="BODY">Body</SelectItem>
                                <SelectItem value="FOOTER">Footer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeComponent(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`components.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={`Enter ${form.watch(`components.${index}.type`).toLowerCase()} content...`}
                              className="resize-none" 
                              {...field} 
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch(`components.${index}.type`) === "BODY" 
                              ? "Use {{1}}, {{2}}, etc. for variables that will be replaced with actual values." 
                              : ""}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => router.push("/marketing/whatsapp/templates")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
} 