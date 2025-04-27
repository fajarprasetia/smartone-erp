"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PaginationWithPages } from "@/components/ui/pagination"

// Asset options
const assetTypes = [
  "Production Equipment",
  "Office Equipment",
  "IT Hardware",
  "Vehicle",
  "Furniture",
  "Building",
  "Software License",
  "Other"
]

const assetStatuses = [
  "Active",
  "Maintenance",
  "Retired",
  "Reserved",
  "Under Repair"
]

const assetLocations = [
  "Production Floor",
  "Office - Main",
  "Office - Remote",
  "Warehouse",
  "Storage",
  "Workshop"
]

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

interface Pagination {
  page: number
  pageSize: number
  totalPages: number
  total: number
}

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    total: 0
  })

  // Fetch assets with filters
  const fetchAssets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        search,
        type: typeFilter,
        status: statusFilter
      })

      const response = await fetch(`/api/inventory/assets?${params}`)
      if (!response.ok) throw new Error("Failed to fetch assets")

      const data = await response.json()
      setAssets(data.assets)
      setPagination({
        ...pagination,
        totalPages: data.totalPages,
        total: data.total
      })
    } catch (error) {
      console.error("Error fetching assets:", error)
      toast.error("Failed to load assets")
    } finally {
      setLoading(false)
    }
  }

  // Handle asset deletion
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/inventory/assets?id=${id}`, {
        method: "DELETE"
      })

      if (!response.ok) throw new Error("Failed to delete asset")

      toast.success("Asset deleted successfully")
      fetchAssets() // Refresh the list
    } catch (error) {
      console.error("Error deleting asset:", error)
      toast.error("Failed to delete asset")
    }
  }

  // Handle search and filter changes
  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  // Fetch assets on mount and when filters change
  useEffect(() => {
    fetchAssets()
  }, [pagination.page, search, typeFilter, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Asset Management</h1>
        <Button asChild>
          <Link href="/inventory/assets/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            Manage your company's assets and equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typeFilter} onValueChange={handleTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Asset Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {assetTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {assetStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assets Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : assets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No assets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>
                          {asset.purchaseDate
                            ? format(new Date(asset.purchaseDate), "PPP")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/inventory/assets/${asset.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/inventory/assets/${asset.id}/edit`)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(asset.id)}
                                className="text-destructive"
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
            </div>

            {/* Pagination */}
            <PaginationWithPages
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}