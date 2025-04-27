"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  type: string | null
  model?: string | null
  serialNumber?: string | null
  purchaseDate?: Date | null
  purchasePrice?: string | null
  warrantyExpiry?: Date | null
  manufacturer?: string | null
  supplier?: string | null
  location?: string | null
  status: string | null
  lastMaintenanceDate?: Date | null
  nextMaintenanceDate?: Date | null
  notes?: string | null
}

const assetTypes = [
  "Production Equipment",
  "Office Equipment",
  "IT Hardware",
  "Vehicle",
  "Furniture",
  "Building",
  "Software License",
  "Other"
]

const assetStatuses = [
  "Active",
  "Maintenance",
  "Retired",
  "Reserved",
  "Under Repair"
]

const assetLocations = [
  "Production Floor",
  "Office - Main",
  "Office - Remote",
  "Warehouse",
  "Storage",
  "Workshop"
]

interface EditAssetFormProps {
  asset: Asset
}

export default function EditAssetForm({ asset }: EditAssetFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Asset>>(asset)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/inventory/assets/${asset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to update asset")

      toast.success("Asset updated successfully")
      router.push(`/inventory/assets/${asset.id}`)
    } catch (error) {
      console.error("Error updating asset:", error)
      toast.error("Failed to update asset")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Edit Asset</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Information</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {assetTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {assetStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={formData.location || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, location: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {assetLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Additional Information</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input
                value={formData.model || ""}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serial Number</label>
              <Input
                value={formData.serialNumber || ""}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Manufacturer</label>
              <Input
                value={formData.manufacturer || ""}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <Input
                value={formData.supplier || ""}
                onChange={(e) =>
                  setFormData({ ...formData, supplier: e.target.value })
                }
              />
            </div>
          </div>

          {/* Purchase Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Purchase Information</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Date</label>
              <Input
                type="date"
                value={
                  formData.purchaseDate
                    ? format(new Date(formData.purchaseDate), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purchaseDate: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purchase Price</label>
              <Input
                type="number"
                value={formData.purchasePrice || ""}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Warranty Expiry</label>
              <Input
                type="date"
                value={
                  formData.warrantyExpiry
                    ? format(new Date(formData.warrantyExpiry), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    warrantyExpiry: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
          </div>

          {/* Maintenance Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Maintenance Information</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium">Last Maintenance Date</label>
              <Input
                type="date"
                value={
                  formData.lastMaintenanceDate
                    ? format(new Date(formData.lastMaintenanceDate), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lastMaintenanceDate: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Next Maintenance Date</label>
              <Input
                type="date"
                value={
                  formData.nextMaintenanceDate
                    ? format(new Date(formData.nextMaintenanceDate), "yyyy-MM-dd")
                    : ""
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nextMaintenanceDate: e.target.value ? new Date(e.target.value) : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
} 