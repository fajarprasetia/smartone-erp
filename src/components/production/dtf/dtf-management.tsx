"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingDTFList } from "./pending-dtf-list";
import DTFInProgressList from "./dtf-in-progress-list";
import { Card } from "@/components/ui/card";

export function DTFManagement() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDTFActionComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="pending">Pending DTF</TabsTrigger>
          <TabsTrigger value="in-progress">DTF List</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <PendingDTFList
            key={`pending-${refreshKey}`}
            onOrderProcessed={handleDTFActionComplete}
          />
        </TabsContent>
        <TabsContent value="in-progress">
          <DTFInProgressList
            key={`in-progress-${refreshKey}`}
            onOrderComplete={handleDTFActionComplete}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
} 