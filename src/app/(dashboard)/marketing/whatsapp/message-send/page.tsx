"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SendMessageForm } from "@/components/marketing/whatsapp/send-message-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function WhatsAppSendPage() {
  const handleSendSuccess = () => {
    toast.success("Message sent successfully!")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Send WhatsApp Message</h2>
        <p className="text-muted-foreground">
          Send template-based messages to your customers via WhatsApp
        </p>
      </div>

      <SendMessageForm onSuccess={handleSendSuccess} />
    </div>
  )
} 