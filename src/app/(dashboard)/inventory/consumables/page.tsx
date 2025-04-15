"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Consumables Tab Components
import { PaperTab } from "@/components/inventory/consumables/paper-tab"
import { InkTab } from "@/components/inventory/consumables/ink-tab"
import { OthersTab } from "@/components/inventory/consumables/others-tab"

export default function ConsumablesPage() {
  const [activeTab, setActiveTab] = useState("paper")
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Consumables Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Consumables Inventory</CardTitle>
          <CardDescription>
            Manage paper, ink, and other consumable materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paper" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paper">Paper</TabsTrigger>
              <TabsTrigger value="ink">Ink</TabsTrigger>
              <TabsTrigger value="others">Others</TabsTrigger>
            </TabsList>
            
            <TabsContent value="paper" className="mt-4">
              <PaperTab />
            </TabsContent>
            
            <TabsContent value="ink" className="mt-4">
              <InkTab />
            </TabsContent>
            
            <TabsContent value="others" className="mt-4">
              <OthersTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}