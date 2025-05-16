"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export default function WhatsAppTestPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestConnection = async () => {
    try {
      setIsLoading(true);
      
      const res = await fetch('/api/test', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      toast({
        title: "Success",
        description: data.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">WhatsApp Test Page</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Test Connection</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleTestConnection} 
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Test Connection"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 