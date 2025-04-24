"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingPressList } from "@/components/production/press/pending-press-list";
import { PressInProgressList } from "@/components/production/press/press-in-progress-list";

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
        <TabsList>
          <TabsTrigger value="pending" onClick={() => setActiveTab("pending")}>Pending Press</TabsTrigger>
          <TabsTrigger value="in-progress" onClick={() => setActiveTab("in-progress")}>Press List</TabsTrigger>
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
    </Tabs>
  );
} 