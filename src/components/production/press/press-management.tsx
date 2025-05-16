"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingPressList } from "@/components/production/press/pending-press-list";
import { PressInProgressList } from "@/components/production/press/press-in-progress-list";
import { PressStocksTab } from "./press-stocks-tab";

export function PressManagement() {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("pending");

  const handlePressStart = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePressComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs defaultValue="pending" className="space-y-4">
      <div className="flex justify-between items-center">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>Pending Press</TabsTrigger>
          <TabsTrigger value="in-progress" onClick={() => setActiveTab("in-progress")}>Press List</TabsTrigger>
          <TabsTrigger value="stocks" onClick={() => setActiveTab("stocks")}>Stocks</TabsTrigger>
        </TabsList>
        
      </div>
      <TabsContent value="pending" className="space-y-4">
        <PendingPressList 
          key={`pending-${refreshKey}`}
          onPressStart={handlePressStart} 
        />
      </TabsContent>
      <TabsContent value="in-progress" className="space-y-4">
        <PressInProgressList 
          key={`in-progress-${refreshKey}`}
          onPressComplete={handlePressComplete} 
        />
      </TabsContent>
      <TabsContent value="stocks" className="space-y-4">
        <PressStocksTab />
      </TabsContent>
    </Tabs>
  );
} 