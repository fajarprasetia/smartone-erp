"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface WhatsAppConfig {
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
  webhookVerifyToken: string
}

export default function WhatsAppSettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<WhatsAppConfig>({
    phoneNumberId: "",
    businessAccountId: "",
    accessToken: "",
    webhookVerifyToken: "smartone-erp-whatsapp-token" // Default value
  })

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({ ...prev, [name]: value }))
  }

  // Save configuration
  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Store the configuration in localStorage for now
      // In production, you would send this to your API
      localStorage.setItem("whatsappConfig", JSON.stringify(config))
      
      toast({
        title: "Success",
        description: "WhatsApp configuration saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Test connection
  const handleTestConnection = async () => {
    try {
      setIsLoading(true)
      
      // For now, just use our test API endpoint
      // In production, you would send the config to your API
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      const data = await res.json()
      
      toast({
        title: "Success",
        description: data.message || "Connection test successful",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure your WhatsApp Business API credentials to enable WhatsApp messaging features.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Cloud API Configuration</CardTitle>
          <CardDescription>
            Enter your WhatsApp Business API credentials obtained from the Meta Developer Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID</Label>
              <Input
                id="phoneNumberId"
                name="phoneNumberId"
                value={config.phoneNumberId}
                onChange={handleChange}
                placeholder="Enter your WhatsApp phone number ID"
              />
              <p className="text-xs text-muted-foreground">
                Found in WhatsApp > Getting Started > select your phone number
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessAccountId">Business Account ID</Label>
              <Input
                id="businessAccountId"
                name="businessAccountId"
                value={config.businessAccountId}
                onChange={handleChange}
                placeholder="Enter your WhatsApp business account ID"
              />
              <p className="text-xs text-muted-foreground">
                Found in WhatsApp > Account Overview
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                name="accessToken"
                type="password"
                value={config.accessToken}
                onChange={handleChange}
                placeholder="Enter your WhatsApp access token"
              />
              <p className="text-xs text-muted-foreground">
                Generate a temporary token or create a system user for permanent access
              </p>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="webhookVerifyToken">Webhook Verify Token</Label>
              <Input
                id="webhookVerifyToken"
                name="webhookVerifyToken"
                value={config.webhookVerifyToken}
                onChange={handleChange}
                placeholder="Enter your webhook verify token"
              />
              <p className="text-xs text-muted-foreground">
                Create a unique verify token to secure your webhook
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            onClick={handleTestConnection} 
            variant="outline" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : "Test Connection"}
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : "Save Configuration"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Webhook Setup</CardTitle>
          <CardDescription>
            Configure your webhook in the Meta Developer Portal to receive messages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-mono break-all">
              {typeof window !== 'undefined' 
                ? `${window.location.origin}/api/webhook/whatsapp` 
                : 'https://your-domain.com/api/webhook/whatsapp'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this URL in your WhatsApp webhook configuration
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Verify Token</Label>
            <div className="p-2 bg-muted rounded-md text-sm font-mono">
              {config.webhookVerifyToken}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Use this token to verify your webhook with WhatsApp
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <h4 className="font-medium text-sm mb-1">Configuration Steps:</h4>
            <ol className="text-sm list-decimal pl-5 space-y-1">
              <li>Go to WhatsApp > Configuration > Webhooks in Meta Developer Portal</li>
              <li>Enter your webhook URL and verify token</li>
              <li>Subscribe to message, message_status_update fields</li>
              <li>Click "Verify and Save"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 