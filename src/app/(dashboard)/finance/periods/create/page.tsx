import { Metadata } from "next"
import FinancialPeriodForm from "@/components/finance/financial-period-form"

export const metadata: Metadata = {
  title: "Create Financial Period | SmartOne ERP",
  description: "Create a new financial period for accounting and reporting",
}

export default function CreateFinancialPeriodPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Financial Period</h1>
        <p className="text-muted-foreground">
          Set up a new financial period for accounting and reporting
        </p>
      </div>
      <FinancialPeriodForm />
    </div>
  )
} 