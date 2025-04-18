"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function OthersStocksTab() {
  const [activeCategory, setActiveCategory] = useState("spareparts")

  return (
    <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Other Consumables Stock Management</CardTitle>
          <Button>Add New Item</Button>
        </div>
        <Tabs defaultValue="spareparts" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spareparts">Spare Parts</TabsTrigger>
            <TabsTrigger value="stationery">Office Stationery</TabsTrigger>
            <TabsTrigger value="miscellaneous">Miscellaneous</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <TabsContent value="spareparts">
          <div className="flex flex-col space-y-4">
            <p className="text-muted-foreground">This section will manage spare parts inventory including machinery parts, tools, and equipment components.</p>
            <div className="rounded-md border p-4">Spare Parts inventory management will be implemented here</div>
          </div>
        </TabsContent>
        
        <TabsContent value="stationery">
          <div className="flex flex-col space-y-4">
            <p className="text-muted-foreground">This section will manage office stationery inventory including paper supplies, pens, and office equipment.</p>
            <div className="rounded-md border p-4">Office Stationery inventory management will be implemented here</div>
          </div>
        </TabsContent>
        
        <TabsContent value="miscellaneous">
          <div className="flex flex-col space-y-4">
            <p className="text-muted-foreground">This section will manage miscellaneous inventory items that don't fit in other categories.</p>
            <div className="rounded-md border p-4">Miscellaneous items inventory management will be implemented here</div>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  )
}