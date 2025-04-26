import { Metadata } from "next";
import { PressManagement } from "@/components/production/press/press-management";

export const metadata: Metadata = {
  title: "Press Management | SmartOne ERP",
  description: "Manage press operations for production orders",
};

export default function PressPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Press Management</h1>
      </div>
      <PressManagement />
    </div>
  );
} 