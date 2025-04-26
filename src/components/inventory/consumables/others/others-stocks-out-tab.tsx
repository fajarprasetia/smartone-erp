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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { format } from "date-fns"

interface OthersItemUsed {
  id: string
  qr_code: string | null
  category: string
  item_name: string
  description: string | null
  quantity: number
  unit: string
  location: string | null
  notes: string | null
  availability: boolean
  user_id: string
  taken_by_user_id: string | null
  created_at: string
  used_at: string
  user: {
    name: string
  }
  taken_by_user: {
    name: string
  } | null
}

export function OthersStocksOutTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [usedItems, setUsedItems] = useState<OthersItemUsed[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch used items
  const fetchUsedItems = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inventory/others-used')
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      setUsedItems(data.items || [])
    } catch (err) {
      setError("Error fetching used items. Please try again.")
      console.error("Error fetching used items:", err)
      toast.error("Failed to load used items")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch items on component mount
  useEffect(() => {
    fetchUsedItems()
  }, [])

  // Handle refresh button click
  const handleRefresh = () => {
    fetchUsedItems()
    toast.success("Refreshed used items list")
  }

  // Filter items based on search query and category
  const filteredItems = usedItems.filter(item => {
    const matchesSearch = 
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.qr_code && item.qr_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Out of Stock Items</CardTitle>
          <div className="flex items-center space-x-2">
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
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-4 text-red-500">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={fetchUsedItems}
            >
              Try Again
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item ID</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Used By</TableHead>
              <TableHead>Used Date</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {Array.from({ length: 8 }).map((_, cellIndex) => (
                    <TableCell key={`loading-cell-${cellIndex}`}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.qr_code || 'N/A'}</TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.description || 'N/A'}</TableCell>
                  <TableCell>{item.user.name}</TableCell>
                  <TableCell>{item.taken_by_user?.name || 'Unknown'}</TableCell>
                  <TableCell>{formatDate(item.used_at)}</TableCell>
                  <TableCell>{item.notes || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  No out-of-stock items found. Items will appear here when they are marked as used.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}