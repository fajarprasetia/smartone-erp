import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/dashboard/overview"
import { RecentSales } from "@/components/dashboard/recent-sales"
import { ArrowUpRight, ArrowDownRight, Users, ShoppingCart, Package, DollarSign } from "lucide-react"
import { formatDate, formatNumber } from "@/lib/utils"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Last updated: {formatDate(new Date())}</span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(45231890)}</div>
            <div className="flex items-center text-xs text-green-700 mt-1">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +20.1% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(2350000)}</div>
            <div className="flex items-center text-xs text-green-700 mt-1">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +180.1% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Production
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(12234000)}</div>
            <div className="flex items-center text-xs text-red-700 mt-1">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -19% from last month
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(573)}</div>
            <div className="flex items-center text-xs text-green-700 mt-1">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +201 since last month
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 hover:bg-white/30 dark:hover:bg-white/10 transition-all duration-300">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 