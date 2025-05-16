"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import  PendingCuttingList  from "./pending-cutting-list";
import  CuttingInProgressList  from "./cutting-in-progress-list";
import { CuttingStocksTab } from "./cutting-stocks-tab";

export function CuttingManagement() {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("pending");

  const handleCuttingStart = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab("in-progress");
  };

  const handleCuttingComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs 
      defaultValue="pending" 
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4"
    >
      <div className="flex justify-between items-center">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="pending">Pending Cutting</TabsTrigger>
          <TabsTrigger value="in-progress">Cutting List</TabsTrigger>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
        </TabsList>
        
      </div>
      <TabsContent value="pending" className="space-y-4">
        <PendingCuttingList 
          key={`pending-${refreshKey}`}
          onCuttingStart={handleCuttingStart} 
        />
      </TabsContent>
      <TabsContent value="in-progress" className="space-y-4">
        <CuttingInProgressList 
          key={`in-progress-${refreshKey}`}
          onCuttingComplete={handleCuttingComplete} 
        />
      </TabsContent>
      <TabsContent value="stocks" className="space-y-4">
        <CuttingStocksTab />
      </TabsContent>
    </Tabs>
  );
} 