"use client"

import { Suspense } from 'react'
import { IntegratedCustomerTable } from '@/components/marketing/integrated-customer-table-new'
import { Card } from "@/components/ui/card"

export default function CustomerPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Management</h2>
          <p className="text-muted-foreground">
            Manage all your customers including WhatsApp contacts in one place
          </p>
        </div>
      </div>
      
      <Card className="p-6">
        <Suspense fallback={<div>Loading customers...</div>}>
          <IntegratedCustomerTable showWhatsappStatus={true} />
        </Suspense>
      </Card>
    </div>
  )
}