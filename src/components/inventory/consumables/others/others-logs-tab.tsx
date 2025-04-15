"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

interface OthersLog {
  id: string
  action: string
  user_id: string
  user_name?: string
  category?: string
  item_name?: string
  quantity?: number
  unit?: string
  notes: string
  created_at: string
}

export function OthersLogsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [logs, setLogs] = useState<OthersLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)

  // Fetch logs data
  const fetchLogs = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      // Build URL with query parameters for filters
      let url = '/api/inventory/others-log'
      const params = new URLSearchParams()
      
      if (actionFilter !== "all") {
        params.append("action", actionFilter)
      }
      
      if (categoryFilter !== "all") {
        params.append("category", categoryFilter.toUpperCase())
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Map API data to component state format
      const formattedLogs = data.logs.map((log: any) => ({
        id: log.id,
        action: log.action,
        user_id: log.user_id,
        user_name: log.user?.name || 'Unknown User',
        category: log.others_request?.category,
        item_name: log.others_request?.item_name,
        quantity: log.others_request?.quantity,
        unit: log.others_request?.unit,
        notes: log.notes,
        created_at: log.created_at
      }))
      
      setLogs(formattedLogs)
    } catch (error) {
      console.error("Error fetching others logs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load logs"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load data when component mounts or when filters change
  useEffect(() => {
    fetchLogs()
  }, [actionFilter, categoryFilter])
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }
  
  // Get badge color based on action
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "ADDED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "REQUESTED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "APPROVED":
        return "bg-green-50 text-green-700 border-green-200"
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200"
      case "USED":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "RESTOCKED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }
  
  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    return (
      (log.item_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.action?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Activity Logs</CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              value={actionFilter}
              onValueChange={setActionFilter}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="ADDED">Added</SelectItem>
                <SelectItem value="REQUESTED">Requested</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="USED">Used</SelectItem>
                <SelectItem value="RESTOCKED">Restocked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="spareparts">Spare Parts</SelectItem>
                <SelectItem value="stationery">Office Stationery</SelectItem>
                <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  No activity logs found. Logs will appear here as inventory actions are performed.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getActionBadgeClass(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.category ? (
                      <Badge variant="outline" className="capitalize">
                        {log.category.toLowerCase()}
                      </Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{log.item_name || "—"}</TableCell>
                  <TableCell>{log.user_name}</TableCell>
                  <TableCell>{log.quantity ? `${log.quantity} ${log.unit || ''}` : "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.notes}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 