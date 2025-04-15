"use client"

import { useState, useEffect } from "react"
import { RefreshCw, AlertCircle, Search, FileDown } from "lucide-react"
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

interface InkStock {
  id: string
  ink_type: string
  color: string
  quantity: string
  unit: string
  manufacturer?: string
  barcode_id?: string
  qrcode?: string
  availability: string
  dateTaken?: string
  takenByUserId?: string
  taker_name?: string
  created_at: string
}

export function InkStocksOutTab() {
  const [inkStocks, setInkStocks] = useState<InkStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [colorFilter, setColorFilter] = useState<string>("ALL")

  // Get unique colors for filtering
  const uniqueColors = Array.from(new Set(inkStocks.map(stock => stock.color)))
  
  // Fetch ink stocks that are unavailable
  const fetchInkStocksOut = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      const response = await fetch('/api/inventory/ink?availability=NO')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.details || `Error: ${response.status}`
        console.error("API error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      setInkStocks(data)
    } catch (error) {
      console.error("Error fetching ink stocks:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load ink stocks"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    fetchInkStocksOut()
  }, [])

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Get color hex for displaying colored badges
  const getColorHex = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      black: "#000000",
      white: "#FFFFFF",
      cyan: "#00FFFF",
      magenta: "#FF00FF",
      yellow: "#FFFF00",
      red: "#FF0000",
      green: "#00FF00",
      blue: "#0000FF",
      orange: "#FFA500",
      purple: "#800080",
      brown: "#A52A2A",
      gray: "#808080",
      pink: "#FFC0CB",
    }
    
    return colorMap[color.toLowerCase()] || "#808080"
  }

  // Filter stocks by search query and color
  const filteredStocks = inkStocks.filter(stock => {
    // Color filter
    if (colorFilter !== "ALL" && stock.color !== colorFilter) {
      return false
    }
    
    // Search filter
    return (
      (stock.ink_type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.color?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.manufacturer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.barcode_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (stock.taker_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })
  
  // Export to CSV
  const exportToCSV = () => {
    if (filteredStocks.length === 0) {
      toast.error("No data to export")
      return
    }
    
    try {
      // Create CSV headers
      const headers = [
        "ID", "Ink Type", "Color", "Quantity", "Unit", "Manufacturer", 
        "Barcode ID", "QR Code", "Date Taken", "Taken By"
      ]
      
      // Map data to CSV rows
      const csvData = filteredStocks.map(stock => [
        stock.id,
        stock.ink_type,
        stock.color,
        stock.quantity,
        stock.unit,
        stock.manufacturer || "",
        stock.barcode_id || "",
        stock.qrcode || "",
        stock.dateTaken ? formatDate(stock.dateTaken) : "",
        stock.taker_name || ""
      ])
      
      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n")
      
      // Create a blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `ink-stocks-out-${format(new Date(), "yyyy-MM-dd")}.csv`)
      link.style.visibility = "hidden"
      
      // Add to document, click and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("CSV export successful")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.error("Failed to export CSV")
    }
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-red-500 font-medium">{isError}</p>
        <Button onClick={fetchInkStocksOut} variant="outline">
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
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Select
            value={colorFilter}
            onValueChange={setColorFilter}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter by color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Colors</SelectItem>
              {uniqueColors.map(color => (
                <SelectItem key={color} value={color}>{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={exportToCSV} 
            disabled={filteredStocks.length === 0}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchInkStocksOut} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Ink Type</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Date Taken</TableHead>
              <TableHead>Taken By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex justify-center items-center space-x-2">
                      <span>Loading ink stocks...</span>
                    </div>
                  ) : (
                    <>
                      No used ink stocks found.
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-mono text-xs">{stock.id.slice(0, 8)}</TableCell>
                  <TableCell>{stock.ink_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-0 bg-opacity-10" style={{ 
                      backgroundColor: `${getColorHex(stock.color.toLowerCase())}20`,
                      color: getColorHex(stock.color.toLowerCase())
                    }}>
                      {stock.color}
                    </Badge>
                  </TableCell>
                  <TableCell>{stock.quantity} {stock.unit}</TableCell>
                  <TableCell>{stock.manufacturer || "N/A"}</TableCell>
                  <TableCell>{formatDate(stock.dateTaken)}</TableCell>
                  <TableCell>{stock.taker_name || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 