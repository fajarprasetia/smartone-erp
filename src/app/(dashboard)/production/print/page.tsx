"use client"

import { PrintManagement } from "@/components/production/print/print-management"

export default function PrintPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Print Management</h1>
      </div>
      <PrintManagement />
    </div>
  )
} 