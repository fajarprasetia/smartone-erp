"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingCuttingList from "./pending-cutting-list";
import CuttingInProgressList from "./cutting-in-progress-list";

export function CuttingManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh the lists when a cutting action is initiated
  const handleCuttingAction = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Tabs
      defaultValue="pending"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">Pending Cutting</TabsTrigger>
        <TabsTrigger value="in-progress">Cutting List</TabsTrigger>
      </TabsList>
      <TabsContent value="pending">
        <PendingCuttingList 
          key={`pending-${refreshKey}`}
          onCuttingStart={handleCuttingAction} 
        />
      </TabsContent>
      <TabsContent value="in-progress">
        <CuttingInProgressList 
          key={`in-progress-${refreshKey}`}
          onCuttingComplete={handleCuttingAction} 
        />
      </TabsContent>
    </Tabs>
  );
} 