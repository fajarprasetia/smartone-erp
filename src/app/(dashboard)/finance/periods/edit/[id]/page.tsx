import { Metadata } from "next"
import FinancialPeriodForm from "@/components/finance/financial-period-form"

export const metadata: Metadata = {
  title: "Edit Financial Period | SmartOne ERP",
  description: "Edit an existing financial period",
}

export default function EditFinancialPeriodPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Financial Period</h1>
        <p className="text-muted-foreground">
          Update the details of an existing financial period
        </p>
      </div>
      <FinancialPeriodForm periodId={params.id} />
    </div>
  )
} 