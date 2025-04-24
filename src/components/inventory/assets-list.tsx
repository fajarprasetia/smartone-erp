"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search, FileEdit, Trash2, ClipboardList } from "lucide-react"
import { formatDate, getStatusColor } from "@/app/(dashboard)/inventory/assets/page"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

interface Asset {
  id: string
  name: string
  type: string
  model?: string | null
  serialNumber?: string | null
  purchaseDate?: Date | null
  purchasePrice?: string | null
  warrantyExpiry?: Date | null
  manufacturer?: string | null
  supplier?: string | null
  location?: string | null
  status: string
  lastMaintenanceDate?: Date | null
  nextMaintenanceDate?: Date | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

interface Pagination {
  page: number
  pageSize: number
  totalPages: number
  total: number
}

interface AssetsListProps {
  assets: Asset[]
  pagination: Pagination
  assetTypes: string[]
  assetStatuses: string[]
  assetLocations: string[]
  searchParams: {
    page?: string
    pageSize?: string
    search?: string
    type?: string
    status?: string
  }
}

export function AssetsList({
  assets,
  pagination,
  assetTypes,
  assetStatuses,
  assetLocations,
  searchParams
}: AssetsListProps) {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState(searchParams.search || "")
  const [typeFilter, setTypeFilter] = useState(searchParams.type || "all")
  const [statusFilter, setStatusFilter] = useState(searchParams.status || "all")
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Handle search
  const handleSearch = () => {
    updateFilters("search", searchValue)
  }
  
  // Handle type filter change
  const handleTypeChange = (value: string) => {
    setTypeFilter(value)
    updateFilters("type", value)
  }
  
  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value)
    updateFilters("status", value)
  }
  
  // Update URL parameters for filtering
  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams()
    
    // Keep existing params
    if (searchParams.page) params.set("page", "1") // Reset to page 1 when filtering
    if (searchParams.pageSize) params.set("pageSize", searchParams.pageSize)
    
    // Set the current filters
    if (key !== "search" && searchValue) params.set("search", searchValue)
    if (key !== "type" && typeFilter !== "all") params.set("type", typeFilter)
    if (key !== "status" && statusFilter !== "all") params.set("status", statusFilter)
    
    // Add the new filter
    if (value && key === "search") params.set(key, value)
    if (value !== "all" && (key === "type" || key === "status")) params.set(key, value)
    
    // Update URL
    router.push(`/inventory/assets?${params.toString()}`)
  }
  
  // Handle pagination
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    
    const params = new URLSearchParams()
    params.set("page", newPage.toString())
    
    if (searchParams.pageSize) params.set("pageSize", searchParams.pageSize)
    if (searchParams.search) params.set("search", searchParams.search)
    if (searchParams.type && searchParams.type !== "all") params.set("type", searchParams.type)
    if (searchParams.status && searchParams.status !== "all") params.set("status", searchParams.status)
    
    router.push(`/inventory/assets?${params.toString()}`)
  }
  
  // Handle asset deletion
  const deleteAsset = async () => {
    if (!selectedAsset) return
    
    try {
      const response = await fetch(`/api/inventory/assets?id=${selectedAsset.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete asset')
      }
      
      toast.success("Asset deleted successfully")
      setIsDeleteDialogOpen(false)
      
      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast.error("Failed to delete asset")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8 w-full"
            />
          </div>
          <Button size="sm" onClick={handleSearch}>Search</Button>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Select value={typeFilter} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {assetTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {assetStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button asChild>
            <Link href="/inventory/assets/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Next Maintenance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No assets found. Try adjusting your filters or adding a new asset.
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(asset.status)} text-white`}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location || '-'}</TableCell>
                    <TableCell>{formatDate(asset.lastMaintenanceDate)}</TableCell>
                    <TableCell>{formatDate(asset.nextMaintenanceDate)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/assets/${asset.id}`}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/assets/${asset.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/inventory/assets/${asset.id}/maintenance`}>
                              <ClipboardList className="mr-2 h-4 w-4" />
                              Maintenance
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAsset(asset)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {pagination.page} of {pagination.totalPages} pages
                ({pagination.total} assets)
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAsset?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAsset} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 