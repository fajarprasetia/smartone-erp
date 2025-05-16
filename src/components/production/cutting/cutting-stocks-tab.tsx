"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CuttingStocksOthersTab } from "./cutting-stocks-others-tab"

export function CuttingStocksTab() {
  return (
    <Tabs defaultValue="others" className="space-y-4">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="others" className="space-y-4">
        <CuttingStocksOthersTab />
      </TabsContent>
    </Tabs>
  )
} 