"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Pencil } from "lucide-react"

interface MaintenanceRecord {
  id: string
  assetId: string
  date: string
  modeltype: string
  description: string
  cost: number
  technician: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const maintenanceTypes = [
  "Preventive",
  "Corrective",
  "Predictive",
  "Emergency",
  "Routine",
  "Scheduled",
  "Unscheduled",
]

export default function MaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null)
  const [formData, setFormData] = useState({
    date: "",
    modeltype: "",
    description: "",
    cost: "",
    technician: "",
    notes: "",
  })

  useEffect(() => {
    fetchRecords()
  }, [params.id])

  async function fetchRecords() {
    try {
      const response = await fetch(`/api/inventory/assets/${params.id}/maintenance`)
      if (!response.ok) throw new Error("Failed to fetch maintenance records")
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      console.error("Error fetching maintenance records:", error)
      toast.error("Failed to load maintenance records")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const response = await fetch(`/api/inventory/assets/${params.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost),
        }),
      })

      if (!response.ok) throw new Error("Failed to add maintenance record")

      const newRecord = await response.json()
      setRecords([newRecord, ...records])
      setFormData({
        date: "",
        modeltype: "",
        description: "",
        cost: "",
        technician: "",
        notes: "",
      })
      toast.success("Maintenance record added successfully")

      // Create bill in accounts payable
      await createBill(newRecord)
    } catch (error) {
      console.error("Error adding maintenance record:", error)
      toast.error("Failed to add maintenance record")
    }
  }

  async function createBill(maintenanceRecord: MaintenanceRecord) {
    try {
      const response = await fetch("/api/finance/payable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: "maintenance", // You might want to create a specific vendor for maintenance
          issueDate: maintenanceRecord.date,
          dueDate: new Date(new Date(maintenanceRecord.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from maintenance date
          amount: maintenanceRecord.cost,
          description: `Maintenance: ${maintenanceRecord.modeltype} - ${maintenanceRecord.description}`,
          reference: `MAINT-${maintenanceRecord.id}`,
        }),
      })

      if (!response.ok) throw new Error("Failed to create bill")

      toast.success("Bill created in accounts payable")
    } catch (error) {
      console.error("Error creating bill:", error)
      toast.error("Failed to create bill in accounts payable")
    }
  }

  async function handleEdit(record: MaintenanceRecord) {
    setEditingRecord(record)
    setFormData({
      date: record.date,
      modeltype: record.modeltype,
      description: record.description,
      cost: record.cost.toString(),
      technician: record.technician,
      notes: record.notes || "",
    })
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRecord) return

    try {
      const response = await fetch(`/api/inventory/assets/${params.id}/maintenance/${editingRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost),
        }),
      })

      if (!response.ok) throw new Error("Failed to update maintenance record")

      const updatedRecord = await response.json()
      setRecords(records.map(record => 
        record.id === updatedRecord.id ? updatedRecord : record
      ))
      setEditingRecord(null)
      setFormData({
        date: "",
        modeltype: "",
        description: "",
        cost: "",
        technician: "",
        notes: "",
      })
      toast.success("Maintenance record updated successfully")
    } catch (error) {
      console.error("Error updating maintenance record:", error)
      toast.error("Failed to update maintenance record")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Maintenance Records</h1>
        <Button onClick={() => router.back()}>Back to Asset</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingRecord ? "Edit Maintenance Record" : "Add Maintenance Record"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingRecord ? handleUpdate : handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.modeltype}
                  onChange={(e) => setFormData({ ...formData, modeltype: e.target.value })}
                  required
                >
                  <option value="">Select type</option>
                  {maintenanceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Technician</label>
                <Input
                  value={formData.technician}
                  onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{editingRecord ? "Update Record" : "Add Record"}</Button>
              {editingRecord && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingRecord(null)
                    setFormData({
                      date: "",
                      modeltype: "",
                      description: "",
                      cost: "",
                      technician: "",
                      notes: "",
                    })
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{record.modeltype} Maintenance</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()} by {record.technician}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">${record.cost.toFixed(2)}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm">{record.description}</p>
                {record.notes && <p className="text-sm text-muted-foreground">{record.notes}</p>}
                <Separator />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 