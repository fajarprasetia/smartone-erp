"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Paper Tab Components
import { PaperStocksTab } from "@/components/inventory/consumables/paper/paper-stocks-tab"
import { PaperAvailableTab } from "@/components/inventory/consumables/paper/paper-available-tab"
import { PaperStocksOutTab } from "@/components/inventory/consumables/paper/paper-stocks-out-tab"
import { PaperRequestsTab } from "@/components/inventory/consumables/paper/paper-requests-tab"
import { PaperLogsTab } from "@/components/inventory/consumables/paper/paper-logs-tab"

export function PaperTab() {
  const [activeTab, setActiveTab] = useState("available")
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="stocksout">Stocks Out</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stocks" className="mt-4">
          <PaperStocksTab />
        </TabsContent>
        
        <TabsContent value="available" className="mt-4">
          <PaperAvailableTab />
        </TabsContent>
        
        <TabsContent value="stocksout" className="mt-4">
          <PaperStocksOutTab />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <PaperRequestsTab />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <PaperLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}