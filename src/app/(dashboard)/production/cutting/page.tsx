"use client"

import { CuttingManagement } from "@/components/production/cutting/cutting-management"

export default function CuttingPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Cutting Management</h1>
      </div>
      <CuttingManagement />
    </div>
  )
} 