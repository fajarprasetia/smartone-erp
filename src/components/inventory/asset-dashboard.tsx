"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HardDrive, Wrench, AlertTriangle } from "lucide-react"

interface AssetCounts {
  active: number
  maintenance: number
  repair: number
}

export function AssetDashboard({ counts }: { counts: AssetCounts }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Assets</CardTitle>
          <HardDrive className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.active}</div>
          <p className="text-xs text-muted-foreground">
            Currently operational assets
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
          <Wrench className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.maintenance}</div>
          <p className="text-xs text-muted-foreground">
            Assets under scheduled maintenance
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Under Repair</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{counts.repair}</div>
          <p className="text-xs text-muted-foreground">
            Assets requiring repair
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 