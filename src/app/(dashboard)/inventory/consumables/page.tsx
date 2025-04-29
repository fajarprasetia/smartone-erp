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
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex justify-between items-center p-6">
        <h1 className="text-2xl font-bold tracking-tight">Consumables Management</h1>
      </div>
      
      <Card className="flex-1 mx-6 mb-6 bg-transparent border-border/30 backdrop-blur-md backdrop-saturate-150 overflow-hidden">
        <CardHeader className="bg-transparent">
          <CardTitle>Consumables Inventory</CardTitle>
          <CardDescription>
            Manage paper, ink, and other consumable materials
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-transparent h-[calc(100%-8rem)] overflow-hidden">
          <Tabs defaultValue="paper" value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 bg-transparent border-border/30">
              <TabsTrigger value="paper" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">Paper</TabsTrigger>
              <TabsTrigger value="ink" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">Ink</TabsTrigger>
              <TabsTrigger value="others" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none">Others</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-auto">
              <TabsContent value="paper" className="h-full mt-4">
                <PaperTab />
              </TabsContent>
              
              <TabsContent value="ink" className="h-full mt-4">
                <InkTab />
              </TabsContent>
              
              <TabsContent value="others" className="h-full mt-4">
                <OthersTab />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}