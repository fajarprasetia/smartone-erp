"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatNumber } from "@/lib/utils"

interface MonthlyData {
  month: number
  year: number
  revenue: number
  name?: string
}

interface OverviewProps {
  data?: MonthlyData[]
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function Overview({ data: propData }: OverviewProps) {
  const [data, setData] = useState<MonthlyData[]>([])
  const [isLoading, setIsLoading] = useState(!propData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (propData) {
      // Sort the data by year and month to ensure chronological order
      const sortedData = [...propData].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      setData(sortedData);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/dashboard/stats')
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }
        
        const result = await response.json()
        
        if (result.overview && Array.isArray(result.overview)) {
          // Sort the data by year and month to ensure chronological order
          const sortedData = [...result.overview].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          });
          
          setData(sortedData);
        } else {
          // Create dummy data if no data is available
          createDummyData()
        }
      } catch (error) {
        console.error('Error fetching overview data:', error)
        setError('Failed to load chart data')
        // Create dummy data if error
        createDummyData()
      } finally {
        setIsLoading(false)
      }
    }
    
    const createDummyData = () => {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      const dummyData = []
      
      // Generate data for the last 12 months
      for (let i = 11; i >= 0; i--) {
        let month = currentMonth - i
        let year = currentYear
        
        // Adjust for previous year
        if (month < 0) {
          month = 12 + month
          year = year - 1
        }
        
        dummyData.push({
          month: month + 1, // 1-indexed month
          year,
          revenue: 0
        })
      }
      
      setData(dummyData)
    }
    
    fetchData()
  }, [propData])

  // Format the data with month names and year
  const formattedData = data.map(item => {
    const monthName = monthNames[item.month - 1]
    const year = item.year || new Date().getFullYear()
    
    return {
      ...item,
      name: `${monthName} ${year.toString().substring(2)}` // e.g. "Jan 23" for January 2023
    }
  })

  console.log('Chart data:', formattedData);

  return (
    <div className="h-[300px] w-full">
      {isLoading ? (
        <div className="flex flex-col space-y-3 h-full w-full">
          <Skeleton className="h-full w-full bg-primary/10" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
          {error}
        </div>
      ) : formattedData.length === 0 ? (
        <div className="flex items-center justify-center h-full w-full text-muted-foreground">
          No revenue data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData}>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '6px',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}
            />
            <CartesianGrid stroke="#dddddd" strokeDasharray="3 3" opacity={0.2} />
            <Bar
              dataKey="revenue"
              fill="rgba(99, 102, 241, 0.8)"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
} 