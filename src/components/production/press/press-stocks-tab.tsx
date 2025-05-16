"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PressStocksOthersTab } from "./press-stocks-others-tab"

export function PressStocksTab() {
  return (
    <Tabs defaultValue="others" className="space-y-4">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="others" className="space-y-4">
        <PressStocksOthersTab />
      </TabsContent>
    </Tabs>
  )
} 