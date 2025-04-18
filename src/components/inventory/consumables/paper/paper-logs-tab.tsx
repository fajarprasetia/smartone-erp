"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Columns } from "@/components/ui/data-table-columns"
import { ActionType, PaperLog } from "@/types/inventory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function PaperLogsTab() {
  const [paperLogs, setPaperLogs] = useState<PaperLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPaperLogs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/inventory/paper-request/log?include_user=true")
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setPaperLogs(data)
    } catch (error) {
      console.error("Error fetching paper logs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch paper logs"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPaperLogs()
  }, [])

  const columns: Columns<PaperLog>[] = [
    {
      accessorKey: "timestamp",
      header: "Date",
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp")
        return timestamp ? format(new Date(timestamp as string), "MMM dd, yyyy HH:mm") : "-"
      },
    },
    {
      accessorKey: "barcode_id",
      header: "Barcode ID",
      cell: ({ row }) => row.getValue("barcode_id") || "-",
    },
    {
      accessorKey: "activity_type",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("activity_type") as string
        
        const colorMap: Record<string, string> = {
          [ActionType.ADDED]: "bg-green-100 text-green-800",
          [ActionType.EDITED]: "bg-blue-100 text-blue-800",
          [ActionType.REMOVED]: "bg-red-100 text-red-800",
          [ActionType.REQUESTED]: "bg-yellow-100 text-yellow-800",
          [ActionType.ALLOCATED]: "bg-purple-100 text-purple-800",
          [ActionType.APPROVED_REQUEST]: "bg-emerald-100 text-emerald-800",
          [ActionType.APPROVED_REQUEST_EXISTING_STOCK]: "bg-emerald-100 text-emerald-800",
          [ActionType.REJECTED_REQUEST]: "bg-red-100 text-red-800"
        }
        
        return (
          <Badge className={colorMap[action] || "bg-gray-100 text-gray-800"}>
            {action}
          </Badge>
        )
      },
    },
    {
      accessorKey: "user_name",
      header: "Performed By",
      cell: ({ row }) => row.getValue("user_name") || "-",
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string | null
        return notes ? notes : "-"
      },
    },
  ]

  return (
    <Card className="bg-background/10 backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Paper Inventory Activity Log</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPaperLogs} 
          disabled={loading}
        >
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-64 text-center gap-4">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchPaperLogs} variant="outline">
              Try Again
            </Button>
          </div>
        ) : paperLogs.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            No logs found
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={paperLogs} 
            searchColumn="notes" 
            searchPlaceholder="Search logs..." 
          />
        )}
      </CardContent>
    </Card>
  )
}