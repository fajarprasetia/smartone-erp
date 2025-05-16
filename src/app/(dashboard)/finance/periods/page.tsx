import { Metadata } from "next"
import FinancialPeriodsComponent from "@/components/finance/financial-periods"

export const metadata: Metadata = {
  title: "Financial Periods | SmartOne ERP",
  description: "Manage financial periods for accounting and reporting",
}

export default function FinancialPeriodsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Periods</h1>
        <p className="text-muted-foreground">
          Create and manage financial periods for accounting and reporting
        </p>
      </div>
      <FinancialPeriodsComponent />
    </div>
  )
} 