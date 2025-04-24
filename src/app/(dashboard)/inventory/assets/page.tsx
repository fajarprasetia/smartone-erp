import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as z from "zod"
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Suspense } from "react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils"
import { AssetsList } from "@/components/inventory/assets-list"
import { AssetDashboard } from "@/components/inventory/asset-dashboard"
import { prisma } from "@/lib/prisma" // Import prisma client

// Define asset and maintenance types
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

interface AssetCounts {
  active: number
  maintenance: number
  repair: number
}

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

// This is a server component
export default async function AssetsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Properly handle searchParams for Next.js 15.2.4
  const page = Number(searchParams?.page || "1")
  const pageSize = Number(searchParams?.pageSize || "10")
  const search = typeof searchParams?.search === 'string' ? searchParams.search : ""
  const type = typeof searchParams?.type === 'string' ? searchParams.type : "all"
  const status = typeof searchParams?.status === 'string' ? searchParams.status : "all"

  // Build where clause for filtering
  const where: any = {}
  
  if (search) {
    // Check which columns actually exist in the database using a raw query
    // to avoid referencing columns that don't exist
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Asset'
    `;
    
    const columns = Array.isArray(tableInfo) 
      ? tableInfo.map((col: any) => col.column_name) 
      : [];
    
    console.log("Available columns in Asset table:", columns);
    
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } }
    ];
    
    // Only add serialNumber condition if it exists in the database
    if (columns.includes('serialNumber')) {
      where.OR.push({ serialNumber: { contains: search, mode: 'insensitive' } });
    }
  }
  
  if (type !== "all") {
    where.type = type
  }
  
  if (status !== "all") {
    where.status = status
  }

  // Count total assets with given filters
  const total = await prisma.asset.count({ where })
  
  // Calculate pagination values
  const totalPages = Math.ceil(total / pageSize)
  const skip = (page - 1) * pageSize
  
  // Get assets with correct field names directly from prisma
  // Use a raw query to avoid column naming issues
  const assets = await prisma.$queryRaw`
    SELECT 
      id, name, type, 
      model, "serialNumber", "purchaseDate", 
      "purchasePrice", "warrantyExpiry", manufacturer,
      supplier, location, status,
      "lastMaintenanceDate", "nextMaintenanceDate", notes,
      "createdAt", "updatedAt"
    FROM "Asset"
    ORDER BY id DESC
    LIMIT ${pageSize} OFFSET ${skip}
  `;

  // Get counts for dashboard statistics
  const activeAssetsCount = await prisma.asset.count({ 
    where: { status: "Active" } 
  })
  
  const maintenanceAssetsCount = await prisma.asset.count({ 
    where: { status: "Maintenance" } 
  })
  
  const repairAssetsCount = await prisma.asset.count({ 
    where: { status: "Under Repair" } 
  })
  
  const counts: AssetCounts = {
    active: activeAssetsCount,
    maintenance: maintenanceAssetsCount,
    repair: repairAssetsCount
  }
  
  const pagination: Pagination = {
    page,
    pageSize,
    totalPages,
    total
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Asset Management</h1>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="list">Asset List</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Suspense fallback={<div>Loading dashboard...</div>}>
            <AssetDashboard counts={counts} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="list" className="space-y-4">
          <Suspense fallback={<div>Loading assets...</div>}>
            <AssetsList 
              assets={assets as any[]}
              pagination={pagination}
              assetTypes={assetTypes}
              assetStatuses={assetStatuses}
              assetLocations={assetLocations}
              searchParams={searchParams || {}}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function getStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-500"
    case "Maintenance":
      return "bg-yellow-500"
    case "Under Repair":
      return "bg-orange-500"
    case "Retired":
      return "bg-gray-500"
    case "Reserved":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

export function formatDate(dateString: Date | string | null | undefined) {
  if (!dateString) return "-"
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return format(date, 'dd MMM yyyy')
  } catch (error) {
    return "-"
  }
}