"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Others Tab Components
import { OthersStocksTab } from "@/components/inventory/consumables/others/others-stocks-tab"
import { OthersAvailableTab } from "@/components/inventory/consumables/others/others-available-tab"
import { OthersStocksOutTab } from "@/components/inventory/consumables/others/others-stocks-out-tab"
import { OthersRequestsTab } from "@/components/inventory/consumables/others/others-requests-tab"
import { OthersLogsTab } from "@/components/inventory/consumables/others/others-logs-tab"

export function OthersTab() {
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
          <OthersStocksTab />
        </TabsContent>
        
        <TabsContent value="available" className="mt-4">
          <OthersAvailableTab />
        </TabsContent>
        
        <TabsContent value="stocksout" className="mt-4">
          <OthersStocksOutTab />
        </TabsContent>
        
        <TabsContent value="requests" className="mt-4">
          <OthersRequestsTab />
        </TabsContent>
        
        <TabsContent value="logs" className="mt-4">
          <OthersLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 