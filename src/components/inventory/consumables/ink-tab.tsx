"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Ink Tab Components
import { InkStocksTab } from "@/components/inventory/consumables/ink/ink-stocks-tab"
import { InkAvailableTab } from "@/components/inventory/consumables/ink/ink-available-tab"
import { InkStocksOutTab } from "@/components/inventory/consumables/ink/ink-stocks-out-tab"
import { InkRequestsTab } from "@/components/inventory/consumables/ink/ink-requests-tab"
import { InkLogsTab } from "@/components/inventory/consumables/ink/ink-logs-tab"

export function InkTab() {
  const [activeTab, setActiveTab] = useState("available")
  
  return (
    <div className="bg-transparent space-y-4">
      <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm mb-6 grid w-full grid-cols-5">
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="stocksout">Stocks Out</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stocks" className="mt-4">
          <InkStocksTab />
        </TabsContent>
        
        <TabsContent value="available" className="mt-4">
          <InkAvailableTab />
        </TabsContent>
        
        <TabsContent value="stocksout" className="mt-4">
          <InkStocksOutTab />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <InkRequestsTab />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <InkLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 