"use client"

import { DTFManagement } from "@/components/production/dtf/dtf-management"

export default function DTFPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">DTF Management</h1>
      </div>
      <DTFManagement />
    </div>
  )
} 