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
import { prisma } from "@/lib/db"
import { assetTypes, assetStatuses, assetLocations } from "@/lib/utils/asset-utils"
import { Asset as PrismaAsset } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

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

interface Asset {
  id: string
  name: string
  type: string | null
  serial_number: string | null
  purchase_date: Date | null
  value: Decimal | null
  supplier: string | null
  location: string | null
  status: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

// This is a server component
export default async function AssetsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Properly handle searchParams for Next.js
  const page = Number(searchParams?.page || "1")
  const pageSize = Number(searchParams?.pageSize || "10")
  const search = typeof searchParams?.search === 'string' ? searchParams.search : ""
  const type = typeof searchParams?.type === 'string' ? searchParams.type : "all"
  const status = typeof searchParams?.status === 'string' ? searchParams.status : "all"

  // Build where clause for filtering
  const where: any = {}
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { serial_number: { contains: search, mode: 'insensitive' } }
    ]
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
  
  // Get assets with pagination
  const assets = await prisma.asset.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    skip,
    take: pageSize
  })

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
          <Suspense fallback={<div>Loading assets list...</div>}>
            <AssetsList 
              assets={assets} 
              pagination={pagination}
              searchParams={{
                search,
                type,
                status
              }}
              assetTypes={assetTypes}
              assetStatuses={assetStatuses}
              assetLocations={assetLocations}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}