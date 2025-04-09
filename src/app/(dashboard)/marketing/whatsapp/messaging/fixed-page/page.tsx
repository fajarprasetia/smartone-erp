"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function FixedMessagingPage() {
  const handleSend = () => {
    toast.success("Test message sent!")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">Fixed WhatsApp Messaging</h2>
        <p className="text-muted-foreground">
          This is a fixed version of the messaging page
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send WhatsApp Message</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSend}>Send Test Message</Button>
        </CardContent>
      </Card>
    </div>
  )
} 