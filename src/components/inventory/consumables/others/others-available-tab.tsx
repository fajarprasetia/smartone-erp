"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, Plus, MoreHorizontal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format } from "date-fns"

// Import the add form component
import { AddOthersForm } from "./add-others-form"

interface OthersItem {
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
  user: {
    name: string
  }
}

export function OthersAvailableTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [items, setItems] = useState<OthersItem[]>([])
  const [isAddFormOpen, setIsAddFormOpen] = useState(false)

  // Fetch available items
  const fetchItems = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      // Build URL with query parameters for filters
      let url = '/api/inventory/others-item'
      const params = new URLSearchParams()
      
      // Only get items that are available
      params.append("availability", "YES")
      
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
      setItems(data.items || [])
    } catch (error) {
      console.error("Error fetching available items:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load items"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts or when category filter changes
  useEffect(() => {
    fetchItems()
  }, [categoryFilter])

  // Handle item added successfully
  const handleItemAdded = () => {
    fetchItems()
    setIsAddFormOpen(false)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Handle mark as used
  const handleMarkAsUsed = async (itemId: string) => {
    try {
      const response = await fetch('/api/inventory/others-item', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemId,
          availability: false,
          taken_at: new Date().toISOString(),
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to mark item as used")
      }
      
      toast.success("Item marked as used")
      fetchItems()
    } catch (error) {
      console.error("Error marking item as used:", error)
      toast.error("Failed to mark item as used")
    }
  }

  // Filter items by search query
  const filteredItems = items.filter(item => {
    return (
      (item.item_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.qr_code?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })

  return (
    <Card className="bg-transparent backdrop-blur-md backdrop-saturate-150 border border-border/30 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Available Items</CardTitle>
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
            <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={fetchItems}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsAddFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID/QR Code</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Added Date</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  No available items found. Items will appear here once they are added to inventory.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.qr_code || item.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {item.category.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.item_name}</TableCell>
                  <TableCell>{item.description || "—"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.location || "—"}</TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                  <TableCell>{item.user?.name || "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMarkAsUsed(item.id)}>
                          Mark as Used
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Add Item Dialog */}
      <AddOthersForm
        open={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
        onSuccess={handleItemAdded}
      />
    </Card>
  )
}