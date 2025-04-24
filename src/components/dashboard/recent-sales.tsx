"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatNumber } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface SaleItem {
  id: string
  customerName: string
  amount: number
  date: string
}

interface RecentSalesProps {
  data?: SaleItem[]
}

export function RecentSales({ data: propData }: RecentSalesProps) {
  const [sales, setSales] = useState<SaleItem[]>([])
  const [isLoading, setIsLoading] = useState(!propData)

  useEffect(() => {
    if (propData) {
      setSales(propData)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const result = await response.json()
        setSales(result.recentSales || [])
      } catch (error) {
        console.error('Error fetching recent sales data:', error)
        // Fallback to empty data
        setSales([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [propData])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full bg-primary/10" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4 bg-primary/10" />
              <Skeleton className="h-4 w-1/2 bg-primary/10" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sales.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No recent sales data available
        </div>
      ) : (
        sales.map((sale) => (
          <div key={sale.id} className="flex items-center">
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarFallback className="bg-primary/10 text-xs">
                {sale.customerName.split(' ').map(part => part[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{sale.customerName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(sale.date).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-auto font-medium">+{formatNumber(sale.amount)}</div>
          </div>
        ))
      )}
    </div>
  )
} 