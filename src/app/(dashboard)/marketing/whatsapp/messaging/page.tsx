"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { MessageSquare, History } from "lucide-react"

export default function WhatsAppMessagingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Messaging</h2>
        <p className="text-muted-foreground">
          Send and manage your WhatsApp messages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Send Messages
            </CardTitle>
            <CardDescription>
              Send template-based messages to your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/marketing/whatsapp/message-send">
                Go to Message Sender
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-2 h-5 w-5" />
              Message History
            </CardTitle>
            <CardDescription>
              View your message history and track delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 