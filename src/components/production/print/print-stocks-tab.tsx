"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Print Stocks Tab Components
import { PrintStocksPaperTab } from "@/components/production/print/print-stocks-paper-tab"
import { PrintStocksInkTab } from "@/components/production/print/print-stocks-ink-tab"

export function PrintStocksTab() {
  const [activeTab, setActiveTab] = useState("paper")
  
  return (
    <div className="space-y-4">
      <Tabs defaultValue="paper" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paper">Paper</TabsTrigger>
          <TabsTrigger value="ink">Ink</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paper" className="mt-4">
          <PrintStocksPaperTab />
        </TabsContent>
        
        <TabsContent value="ink" className="mt-4">
          <PrintStocksInkTab />
        </TabsContent>
      </Tabs>
    </div>
  )
} 