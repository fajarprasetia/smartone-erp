"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { ArrowUpRight, ArrowDownRight, Users, ShoppingCart, Package, DollarSign, Loader2 } from "lucide-react"
import { formatDate, formatNumber } from "@/lib/utils"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  revenue: {
    total: number
    growthPercentage: number
  }
  orders: {
    total: number
    growthPercentage: number
  }
  production: {
    total: number
    growthPercentage: number | null
  }
  customers: {
    active: number
    growthPercentage: number
  }
  overview: any[]
  recentSales: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/dashboard/stats', { 
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Failed to load dashboard data. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Last updated: {formatDate(new Date())}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StatSkeleton positive={true} />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(stats?.revenue.total || 0)}</div>
                <div className={`flex items-center text-xs ${stats?.revenue.growthPercentage && stats.revenue.growthPercentage >= 0 ? 'text-green-700' : 'text-red-700'} mt-1`}>
                  {stats?.revenue.growthPercentage && stats.revenue.growthPercentage >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(stats?.revenue.growthPercentage || 0).toFixed(1)}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StatSkeleton positive={true} />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.orders.total || 0}</div>
                <div className={`flex items-center text-xs ${stats?.orders.growthPercentage && stats.orders.growthPercentage >= 0 ? 'text-green-700' : 'text-red-700'} mt-1`}>
                  {stats?.orders.growthPercentage && stats.orders.growthPercentage >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(stats?.orders.growthPercentage || 0).toFixed(1)}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Production
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StatSkeleton positive={false} />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.production.total || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Items currently in production
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Month Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <StatSkeleton positive={true} />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.customers.active || 0}</div>
                <div className={`flex items-center text-xs ${stats?.customers.growthPercentage && stats.customers.growthPercentage >= 0 ? 'text-green-700' : 'text-red-700'} mt-1`}>
                  {stats?.customers.growthPercentage && stats.customers.growthPercentage >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(stats?.customers.growthPercentage || 0).toFixed(1)}% from last month
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview data={stats?.overview} />
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales data={stats?.recentSales} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Simple skeleton component for stats
function StatSkeleton({ positive = true }: { positive?: boolean }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/2 bg-primary/10" />
      <div className="flex items-center">
        <Skeleton className="h-4 w-4 mr-1 rounded-full bg-primary/10" />
        <Skeleton className="h-4 w-28 bg-primary/10" />
      </div>
    </div>
  )
} 