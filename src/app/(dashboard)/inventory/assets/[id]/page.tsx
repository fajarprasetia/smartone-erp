"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Pencil, Wrench } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

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
  createdAt: Date
  updatedAt: Date
}

interface MaintenanceRecord {
  id: string
  assetId: string
  date: Date
  type: string
  description: string
  cost: string | null
  technician: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export default function AssetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAsset()
  }, [params.id])

  async function fetchAsset() {
    try {
      const response = await fetch(`/api/inventory/assets/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch asset")
      const data = await response.json()
      setAsset(data.asset)
      setMaintenanceRecords(data.maintenanceRecords)
    } catch (error) {
      console.error("Error fetching asset:", error)
      toast.error("Failed to load asset details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!asset) {
    return <div>Asset not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{asset.name}</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild>
            <Link href={`/inventory/assets/${params.id}/maintenance`}>
              <Wrench className="mr-2 h-4 w-4" />
              Maintenance
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/inventory/assets/${params.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Asset Details */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>Basic information about the asset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{asset.type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    asset.status === "Active"
                      ? "default"
                      : asset.status === "Maintenance"
                      ? "warning"
                      : asset.status === "Retired"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {asset.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{asset.model || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serial Number</p>
                <p className="font-medium">{asset.serialNumber || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{asset.location || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{asset.manufacturer || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Information</CardTitle>
            <CardDescription>Details about the asset purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase Date</p>
                <p className="font-medium">
                  {asset.purchaseDate
                    ? format(new Date(asset.purchaseDate), "PPP")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Purchase Price</p>
                <p className="font-medium">
                  {asset.purchasePrice ? formatCurrency(asset.purchasePrice) : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{asset.supplier || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                <p className="font-medium">
                  {asset.warrantyExpiry
                    ? format(new Date(asset.warrantyExpiry), "PPP")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Information</CardTitle>
            <CardDescription>Maintenance schedule and history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Last Maintenance</p>
                <p className="font-medium">
                  {asset.lastMaintenanceDate
                    ? format(new Date(asset.lastMaintenanceDate), "PPP")
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Maintenance</p>
                <p className="font-medium">
                  {asset.nextMaintenanceDate
                    ? format(new Date(asset.nextMaintenanceDate), "PPP")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance History</CardTitle>
            <CardDescription>Recent maintenance records</CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceRecords.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance records found</p>
            ) : (
              <div className="space-y-4">
                {maintenanceRecords.map((record) => (
                  <div key={record.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{record.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.date), "PPP")}
                        </p>
                      </div>
                      {record.cost && (
                        <p className="font-medium">
                          {formatCurrency(record.cost)}
                        </p>
                      )}
                    </div>
                    <p className="text-sm">{record.description}</p>
                    {record.notes && (
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
                    )}
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 