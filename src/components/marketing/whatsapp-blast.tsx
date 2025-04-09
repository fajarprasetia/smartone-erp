'use client'

import { useState, useEffect } from 'react'
import { Customer } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/components/ui/use-toast'
import { AlertCircle, CheckCircle2, Send } from 'lucide-react'

// Template message type
type TemplateMessage = {
  id: string
  name: string
  language: string
  components: TemplateComponent[]
}

type TemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  text?: string
  parameters?: TemplateParameter[]
}

type TemplateParameter = {
  type: 'text' | 'image' | 'document' | 'video'
  text?: string
  image_url?: string
  document_url?: string
  video_url?: string
}

export function WhatsAppBlast() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [templates, setTemplates] = useState<TemplateMessage[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [blastResults, setBlastResults] = useState<{success: number, failed: number, total: number} | null>(null)
  
  // Load customers and templates on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        
        // Load customers
        const customersRes = await fetch('/api/marketing/customers', { cache: 'no-store' })
        if (!customersRes.ok) throw new Error('Failed to fetch customers')
        const customersData = await customersRes.json()
        setCustomers(customersData)
        
        // Load templates
        const templatesRes = await fetch('/api/marketing/whatsapp/templates', { cache: 'no-store' })
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          setTemplates(templatesData)
          
          // Select first template by default if available
          if (templatesData.length > 0) {
            setSelectedTemplate(templatesData[0].id)
            
            // Initialize template parameters
            const params: Record<string, string> = {}
            templatesData[0].components.forEach(component => {
              component.parameters?.forEach((param, index) => {
                if (param.type === 'text') {
                  params[`${component.type.toLowerCase()}_${index}`] = ''
                }
              })
            })
            setTemplateParams(params)
          }
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading data:', error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    loadData()
  }, [])
  
  // Handle template selection change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    // Reset template parameters
    const template = templates.find(t => t.id === templateId)
    if (template) {
      const params: Record<string, string> = {}
      template.components.forEach(component => {
        component.parameters?.forEach((param, index) => {
          if (param.type === 'text') {
            params[`${component.type.toLowerCase()}_${index}`] = ''
          }
        })
      })
      setTemplateParams(params)
    }
  }
  
  // Handle parameter change
  const handleParamChange = (key: string, value: string) => {
    setTemplateParams(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // Handle select all customers
  const handleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(customers.map(c => c.id))
    }
  }
  
  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }
  
  // Handle send blast
  const handleSendBlast = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: "No customers selected",
        description: "Please select at least one customer to send the message to.",
        variant: "destructive"
      })
      return
    }
    
    if (!selectedTemplate) {
      toast({
        title: "No template selected",
        description: "Please select a template message to send.",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSending(true)
      setBlastResults(null)
      
      const template = templates.find(t => t.id === selectedTemplate)
      
      const res = await fetch('/api/marketing/whatsapp/blast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerIds: selectedCustomers,
          templateId: selectedTemplate,
          templateName: template?.name,
          language: template?.language || 'en',
          parameters: templateParams
        }),
      })
      
      if (!res.ok) throw new Error('Failed to send blast messages')
      
      const result = await res.json()
      setBlastResults(result)
      
      toast({
        title: "Blast messages sent",
        description: `Successfully sent ${result.success} out of ${result.total} messages.`,
      })
    } catch (error) {
      console.error('Error sending blast messages:', error)
      toast({
        title: "Error",
        description: "Failed to send blast messages. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }
  
  // Get selected template
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Template selection and configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Template Message</CardTitle>
            <CardDescription>
              Select a template and configure parameters to send to your customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <p>Loading templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No templates available</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You need to create templates in your WhatsApp Business Account first.
                        Visit the <a href="https://business.facebook.com/" className="font-medium underline" target="_blank" rel="noopener noreferrer">Meta Business Suite</a> to create templates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="template">Select Template</Label>
                  <Select 
                    value={selectedTemplate} 
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplateData && (
                  <div className="space-y-4 mt-4">
                    <div className="rounded-md bg-muted p-4">
                      <h4 className="font-medium mb-2">Template Preview</h4>
                      {selectedTemplateData.components.map((component, idx) => (
                        <div key={`${component.type}_${idx}`} className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-1">{component.type}</p>
                          <p>{component.text || 'No text content'}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Template Parameters</h4>
                      {selectedTemplateData.components.flatMap((component, compIdx) => 
                        component.parameters?.map((param, paramIdx) => {
                          const paramKey = `${component.type.toLowerCase()}_${paramIdx}`
                          return param.type === 'text' ? (
                            <div key={paramKey} className="space-y-2">
                              <Label htmlFor={paramKey}>
                                {component.type} Parameter {paramIdx + 1}
                              </Label>
                              {component.type === 'BODY' ? (
                                <Textarea
                                  id={paramKey}
                                  value={templateParams[paramKey] || ''}
                                  onChange={(e) => handleParamChange(paramKey, e.target.value)}
                                  placeholder={`Enter value for ${component.type} parameter ${paramIdx + 1}`}
                                />
                              ) : (
                                <Input
                                  id={paramKey}
                                  value={templateParams[paramKey] || ''}
                                  onChange={(e) => handleParamChange(paramKey, e.target.value)}
                                  placeholder={`Enter value for ${component.type} parameter ${paramIdx + 1}`}
                                />
                              )}
                            </div>
                          ) : null
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Customer selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Recipients</CardTitle>
            <CardDescription>
              Choose which customers will receive the template message
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-20">
                <p>Loading customers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">No customers available</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You need to add customers first. Go to the Customer page to add customers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="select-all" 
                    checked={selectedCustomers.length === customers.length && customers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All ({customers.length})</Label>
                </div>
                
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {customers.map(customer => (
                      <div key={customer.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`customer-${customer.id}`} 
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => handleCustomerSelect(customer.id)}
                        />
                        <Label htmlFor={`customer-${customer.id}`} className="flex-1">
                          <div className="flex justify-between">
                            <span>{customer.name}</span>
                            <span className="text-muted-foreground">
                              {customer.phone ? `62${customer.phone}` : 'No phone'}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    Selected {selectedCustomers.length} of {customers.length} customers
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={handleSendBlast}
              disabled={isLoading || isSending || selectedCustomers.length === 0 || !selectedTemplate}
            >
              {isSending ? 'Sending...' : 'Send Blast Message'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Results */}
      {blastResults && (
        <Card>
          <CardHeader>
            <CardTitle>Blast Results</CardTitle>
            <CardDescription>
              Summary of the blast message campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-muted p-4">
                <p className="text-2xl font-bold">{blastResults.total}</p>
                <p className="text-sm text-muted-foreground">Total Messages</p>
              </div>
              <div className="rounded-md bg-green-50 p-4">
                <p className="text-2xl font-bold text-green-600">{blastResults.success}</p>
                <p className="text-sm text-green-600">Successful</p>
              </div>
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-2xl font-bold text-red-600">{blastResults.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}