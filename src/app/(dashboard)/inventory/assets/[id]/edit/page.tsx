"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  type: string
  model: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: number
  warrantyExpiry: string
  manufacturer: string
  supplier: string
  location: string
  status: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  notes: string
}

const ASSET_TYPES = [
  "Equipment",
  "Vehicle",
  "Tool",
  "Furniture",
  "Computer",
  "Other"
]

const ASSET_STATUSES = [
  "Active",
  "In Maintenance",
  "Retired",
  "Lost",
  "Stolen"
]

const ASSET_LOCATIONS = [
  "Main Office",
  "Warehouse",
  "Production Floor",
  "Field",
  "Storage"
]

export default function EditAssetPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAsset() {
      try {
        const response = await fetch(`/api/inventory/assets/${params.id}`)
        if (!response.ok) {
          throw new Error("Failed to fetch asset")
        }
        const data = await response.json()
        setAsset(data)
      } catch (error) {
        console.error("Error fetching asset:", error)
        toast.error("Failed to load asset details")
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [params.id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!asset) {
    return <div>Asset not found</div>
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      model: formData.get("model") as string,
      serialNumber: formData.get("serialNumber") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      purchasePrice: parseFloat(formData.get("purchasePrice") as string),
      warrantyExpiry: formData.get("warrantyExpiry") as string,
      manufacturer: formData.get("manufacturer") as string,
      supplier: formData.get("supplier") as string,
      location: formData.get("location") as string,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string
    }

    try {
      const response = await fetch(`/api/inventory/assets/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error("Failed to update asset")
      }

      toast.success("Asset updated successfully")
      router.push(`/inventory/assets/${params.id}`)
    } catch (error) {
      console.error("Error updating asset:", error)
      toast.error("Failed to update asset")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Asset</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Name
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={asset.name}
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Type
              </label>
              <Select name="type" defaultValue={asset.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model
              </label>
              <Input
                id="model"
                name="model"
                defaultValue={asset.model}
              />
            </div>
            <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium mb-1">
                Serial Number
              </label>
              <Input
                id="serialNumber"
                name="serialNumber"
                defaultValue={asset.serialNumber}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Additional Information</h2>
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-1">
                Location
              </label>
              <Select name="location" defaultValue={asset.location}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium mb-1">
                Status
              </label>
              <Select name="status" defaultValue={asset.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium mb-1">
                Manufacturer
              </label>
              <Input
                id="manufacturer"
                name="manufacturer"
                defaultValue={asset.manufacturer}
              />
            </div>
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium mb-1">
                Supplier
              </label>
              <Input
                id="supplier"
                name="supplier"
                defaultValue={asset.supplier}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Purchase Information</h2>
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium mb-1">
                Purchase Date
              </label>
              <Input
                id="purchaseDate"
                name="purchaseDate"
                type="date"
                defaultValue={asset.purchaseDate}
              />
            </div>
            <div>
              <label htmlFor="purchasePrice" className="block text-sm font-medium mb-1">
                Purchase Price
              </label>
              <Input
                id="purchasePrice"
                name="purchasePrice"
                type="number"
                step="0.01"
                defaultValue={asset.purchasePrice}
              />
            </div>
            <div>
              <label htmlFor="warrantyExpiry" className="block text-sm font-medium mb-1">
                Warranty Expiry
              </label>
              <Input
                id="warrantyExpiry"
                name="warrantyExpiry"
                type="date"
                defaultValue={asset.warrantyExpiry}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Maintenance Information</h2>
            <div>
              <label htmlFor="lastMaintenanceDate" className="block text-sm font-medium mb-1">
                Last Maintenance Date
              </label>
              <Input
                id="lastMaintenanceDate"
                name="lastMaintenanceDate"
                type="date"
                defaultValue={asset.lastMaintenanceDate}
                disabled
              />
            </div>
            <div>
              <label htmlFor="nextMaintenanceDate" className="block text-sm font-medium mb-1">
                Next Maintenance Date
              </label>
              <Input
                id="nextMaintenanceDate"
                name="nextMaintenanceDate"
                type="date"
                defaultValue={asset.nextMaintenanceDate}
                disabled
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">
                Notes
              </label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={asset.notes}
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/inventory/assets/${params.id}`)}
          >
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  )
} 