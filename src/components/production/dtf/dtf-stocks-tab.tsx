"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DTFStocksFilmTab } from "./dtf-stocks-film-tab"
import { DTFStocksOthersTab } from "./dtf-stocks-others-tab"

export function DTFStocksTab() {
  return (
    <Tabs defaultValue="film" className="space-y-4">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="film">DTF Film</TabsTrigger>
          <TabsTrigger value="others">Others</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="film" className="space-y-4">
        <DTFStocksFilmTab />
      </TabsContent>
      <TabsContent value="others" className="space-y-4">
        <DTFStocksOthersTab />
      </TabsContent>
    </Tabs>
  )
} 