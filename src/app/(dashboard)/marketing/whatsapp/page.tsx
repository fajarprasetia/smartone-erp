"use client"

import Link from "next/link"
import { 
  MessageSquare, 
  Users, 
  Settings, 
  FileText, 
  BarChart, 
  ArrowRight 
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatNumber } from "@/lib/utils"

export default function WhatsAppDashboardPage() {
  // In a real app, these stats would come from an API
  const stats = {
    totalMessages: 1237,
    deliveryRate: 98.5,
    readRate: 76.2,
    activeTemplates: 5,
    contacts: 472,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Business Platform</h2>
        <p className="text-muted-foreground">
          Manage your WhatsApp business messaging, templates, and contacts
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <MessageSquare className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Messaging</CardTitle>
            <CardDescription>
              Send template-based messages to your customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Messages</div>
                <div className="text-2xl font-bold mt-1">{formatNumber(stats.totalMessages)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Delivery Rate</div>
                <div className="text-2xl font-bold mt-1">{stats.deliveryRate}%</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/marketing/whatsapp/messaging">
                Send Messages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <FileText className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              Manage your message templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Active Templates</div>
                <div className="text-2xl font-bold mt-1">{stats.activeTemplates}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Read Rate</div>
                <div className="text-2xl font-bold mt-1">{stats.readRate}%</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/marketing/whatsapp/templates">
                Manage Templates
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>
              Manage your WhatsApp customer contacts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Contacts</div>
                <div className="text-2xl font-bold mt-1">{formatNumber(stats.contacts)}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/marketing/customer">
                Manage Contacts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-1 md:col-span-2 lg:col-span-2 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <BarChart className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>WhatsApp Analytics</CardTitle>
            <CardDescription>
              Performance metrics for your WhatsApp messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground">Analytics dashboard coming soon</p>
          </CardContent>
        </Card>

        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <Settings className="h-8 w-8 text-primary mb-2"/>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Configure your WhatsApp Business API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="text-muted-foreground">
                Configure your WhatsApp Business API settings, including API keys and webhooks.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/settings/whatsapp">
                Configure Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}