"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingPrintTab } from "./print/pending-print-tab";
import { PrintListTab } from "./print/print-list-tab";
import { PrintStocksTab } from "./print/print-stocks-tab";

export function PrintManagement() {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("pending");

  const handlePrintStart = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePrintComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>Pending Print</TabsTrigger>
          <TabsTrigger value="list" onClick={() => setActiveTab("list")}>Print List</TabsTrigger>
          <TabsTrigger value="stocks" onClick={() => setActiveTab("stocks")}>Stocks</TabsTrigger>
        </TabsList>
        <div className="text-sm text-muted-foreground">
          Note: Orders with "PRESS ONLY" or "CUTTING ONLY" products are automatically filtered out.
        </div>
      </div>
      <TabsContent value="pending" className="space-y-4">
        <PendingPrintTab 
          key={`pending-${refreshKey}`}
        />
      </TabsContent>
      <TabsContent value="list" className="space-y-4">
        <PrintListTab 
          key={`list-${refreshKey}`}
        />
      </TabsContent>
      <TabsContent value="stocks" className="space-y-4">
        <PrintStocksTab />
      </TabsContent>
    </Tabs>
  );
} 