"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingCuttingList } from "./cutting/pending-cutting-list";
import { CuttingInProgressList } from "./cutting/cutting-in-progress-list";

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
        <TabsList>
          <TabsTrigger value="pending">Pending Cutting</TabsTrigger>
          <TabsTrigger value="in-progress">Cutting List</TabsTrigger>
        </TabsList>
        <div className="text-sm text-muted-foreground">
          Note: Orders with "PRINT ONLY" or "PRESS ONLY" products are automatically filtered out.
        </div>
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
    </Tabs>
  );
} 