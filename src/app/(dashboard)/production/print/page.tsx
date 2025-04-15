"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Print Tab Components
import { PrintStocksTab } from "@/components/production/print/print-stocks-tab"
import { PendingPrintTab } from "@/components/production/print/pending-print-tab"
import { PrintListTab } from "@/components/production/print/print-list-tab"

export default function PrintPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("pending")
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Print Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Print Operations</CardTitle>
          <CardDescription>
            Manage printing processes and consumable stocks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending Print</TabsTrigger>
              <TabsTrigger value="list">Print List</TabsTrigger>
              <TabsTrigger value="stocks">Stocks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              <PendingPrintTab />
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <PrintListTab />
            </TabsContent>
            
            <TabsContent value="stocks" className="mt-4">
              <PrintStocksTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 