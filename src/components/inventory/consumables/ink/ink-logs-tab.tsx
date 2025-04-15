"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, Search, Filter } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface InkActivityLog {
  id: string
  activity_type: string
  ink_stock_id?: string
  ink_request_id?: string
  user_id: string
  user_name: string
  action_details: string
  notes?: string
  timestamp: string
}

export function InkLogsTab() {
  const [activityLogs, setActivityLogs] = useState<InkActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([
    "ADD_STOCK", "REQUEST", "APPROVE_REQUEST", "REJECT_REQUEST"
  ])
  
  const activityTypeOptions = [
    { id: "ADD_STOCK", label: "Add Stock" },
    { id: "REQUEST", label: "Request" },
    { id: "APPROVE_REQUEST", label: "Approve" },
    { id: "REJECT_REQUEST", label: "Reject" },
  ]

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      const response = await fetch('/api/inventory/ink-request/log?include_user=true')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || `Error: ${response.status}`
        console.error("API error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setActivityLogs(data)
    } catch (error) {
      console.error("Error fetching activity logs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load activity logs"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    fetchActivityLogs()
  }, [])

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Format date for filter
  const formatFilterDate = (date: Date | undefined) => {
    if (!date) return "All Dates"
    return format(date, "dd MMM yyyy")
  }

  // Get activity type badge
  const getActivityTypeBadge = (activityType: string) => {
    switch (activityType) {
      case "ADD_STOCK":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Add Stock</Badge>
      case "REQUEST":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Request</Badge>
      case "APPROVE_REQUEST":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approve</Badge>
      case "REJECT_REQUEST":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Reject</Badge>
      default:
        return <Badge variant="outline">{activityType}</Badge>
    }
  }

  // Toggle activity type selection
  const toggleActivityType = (activityType: string) => {
    if (selectedActivityTypes.includes(activityType)) {
      setSelectedActivityTypes(selectedActivityTypes.filter(type => type !== activityType))
    } else {
      setSelectedActivityTypes([...selectedActivityTypes, activityType])
    }
  }

  // Apply activity type filter
  const applyActivityTypeFilter = () => {
    setActivityTypeFilter(selectedActivityTypes.length === 0 || selectedActivityTypes.length === activityTypeOptions.length 
      ? "ALL" 
      : "CUSTOM")
    setFilterPopoverOpen(false)
  }

  // Reset filters
  const resetFilters = () => {
    setSelectedActivityTypes(activityTypeOptions.map(option => option.id))
    setDateFilter(undefined)
    setActivityTypeFilter("ALL")
    setFilterPopoverOpen(false)
  }

  // Filter logs
  const filteredLogs = activityLogs.filter(log => {
    // Activity type filter
    if (activityTypeFilter === "CUSTOM" && !selectedActivityTypes.includes(log.activity_type)) {
      return false
    }
    
    // Date filter
    if (dateFilter) {
      const logDate = new Date(log.timestamp)
      const filterDate = new Date(dateFilter)
      
      if (logDate.getFullYear() !== filterDate.getFullYear() ||
          logDate.getMonth() !== filterDate.getMonth() ||
          logDate.getDate() !== filterDate.getDate()) {
        return false
      }
    }
    
    // Search filter
    return (
      (log.activity_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.action_details?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (log.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-red-500 font-medium">{isError}</p>
        <Button onClick={fetchActivityLogs} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {activityTypeFilter !== "ALL" || dateFilter ? "Filters Applied" : "Filter"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Activity Type</h4>
                  <div className="space-y-1">
                    {activityTypeOptions.map(option => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`activity-${option.id}`} 
                          checked={selectedActivityTypes.includes(option.id)}
                          onCheckedChange={() => toggleActivityType(option.id)}
                        />
                        <Label htmlFor={`activity-${option.id}`}>{option.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Date</h4>
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    className="rounded-md border"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyActivityTypeFilter}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchActivityLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Activity Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action Details</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span>Loading activity logs...</span>
                    </div>
                  ) : (
                    <>
                      No activity logs found.
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>{getActivityTypeBadge(log.activity_type)}</TableCell>
                  <TableCell>{log.user_name || "N/A"}</TableCell>
                  <TableCell>{log.action_details}</TableCell>
                  <TableCell className="max-w-xs truncate">{log.notes || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 