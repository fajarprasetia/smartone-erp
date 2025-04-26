"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PrintStartFormProps {
  order: {
    id: string;
    spk: string;
    customer: { nama: string };
    produk?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function PrintStartForm({ order, onSuccess, onCancel }: PrintStartFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Implement API call here
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess();
    } catch (error) {
      console.error("Error starting print:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="operator">Print Operator</Label>
        <Input id="operator" placeholder="Enter operator name" required />
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Starting..." : "Start Print"}
        </Button>
      </div>
    </form>
  );
} 