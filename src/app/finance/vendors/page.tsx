import { Metadata } from "next"
import { FormVendor } from "@/components/finance/FormVendor"

export const metadata: Metadata = {
  title: "Vendors",
  description: "Manage your vendors",
}

export default function VendorsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Create and manage your vendors
          </p>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-6">Create New Vendor</h2>
          <FormVendor />
        </div>
      </div>
    </div>
  )
} 