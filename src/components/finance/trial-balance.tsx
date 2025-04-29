"use client"

import React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Download, Printer, RefreshCw, FilterX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrialBalanceAccount {
  id: string
  code: string
  name: string
  type: string
  debit: number
  credit: number
  balance: number
  isDebit: boolean
}

interface FinancialPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  isClosed: boolean
}

interface TrialBalanceData {
  accounts: TrialBalanceAccount[]
  totals: {
    debit: number
    credit: number
  }
  asOfDate: string
  periodId?: string
  periodName?: string
}

export function TrialBalance() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<TrialBalanceData | null>(null)
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<string>("by-date")
  
  useEffect(() => {
    // Fetch periods as soon as component mounts
    fetchPeriods()
  }, [])
  
  useEffect(() => {
    // Fetch trial balance data when the selection changes
    if (activeTab === "by-date" && selectedDate) {
      fetchTrialBalanceByDate(selectedDate)
    } else if (activeTab === "by-period" && selectedPeriod) {
      fetchTrialBalanceByPeriod(selectedPeriod)
    }
  }, [activeTab, selectedDate, selectedPeriod])
  
  const fetchPeriods = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/finance/periods")
      
      if (!response.ok) {
        throw new Error("Failed to fetch financial periods")
      }
      
      const data = await response.json()
      setPeriods(data)
      
      // If there are periods, select the most recent one by default
      if (data && data.length > 0) {
        setSelectedPeriod(data[0].id) // Assuming periods are sorted by date desc
      }
    } catch (error) {
      console.error("Error fetching financial periods:", error)
      toast.error("Failed to load financial periods")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchTrialBalanceByDate = async (date: Date) => {
    setIsLoading(true)
    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      
      const response = await fetch(`/api/finance/reports/trial-balance?asOfDate=${formattedDate}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch trial balance")
      }
      
      const trialBalanceData = await response.json()
      setData(trialBalanceData)
    } catch (error) {
      console.error("Error fetching trial balance:", error)
      toast.error("Failed to load trial balance")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchTrialBalanceByPeriod = async (periodId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/finance/reports/trial-balance?periodId=${periodId}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch trial balance")
      }
      
      const trialBalanceData = await response.json()
      setData(trialBalanceData)
    } catch (error) {
      console.error("Error fetching trial balance:", error)
      toast.error("Failed to load trial balance")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }
  
  const handleRefresh = () => {
    if (activeTab === "by-date") {
      fetchTrialBalanceByDate(selectedDate)
    } else {
      fetchTrialBalanceByPeriod(selectedPeriod!)
    }
  }
  
  const handleExportPDF = () => {
    toast.info("Exporting to PDF...", {
      description: "This feature is not yet implemented",
    })
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMMM yyyy")
  }
  
  const renderAccountRows = () => {
    if (!data || !data.accounts) return null
    
    // Group accounts by type for better organization
    const groupedAccounts = data.accounts.reduce((groups, account) => {
      if (!groups[account.type]) {
        groups[account.type] = []
      }
      groups[account.type].push(account)
      return groups
    }, {} as Record<string, TrialBalanceAccount[]>)
    
    // Define the order of account types
    const typeOrder = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]
    
    // Create rows for each account type
    const rows: React.JSX.Element[] = []
    
    typeOrder.forEach(type => {
      if (groupedAccounts[type] && groupedAccounts[type].length > 0) {
        // Add type header
        rows.push(
          <TableRow key={type} className="bg-muted/50">
            <TableCell colSpan={2} className="font-bold">
              {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
            </TableCell>
            <TableCell className="text-right"></TableCell>
            <TableCell className="text-right"></TableCell>
          </TableRow>
        )
        
        // Add accounts of this type
        groupedAccounts[type].forEach(account => {
          rows.push(
            <TableRow key={account.id}>
              <TableCell className="font-mono">{account.code}</TableCell>
              <TableCell>{account.name}</TableCell>
              <TableCell className="text-right font-mono">
                {account.debit > 0 ? formatCurrency(account.debit) : ""}
              </TableCell>
              <TableCell className="text-right font-mono">
                {account.credit > 0 ? formatCurrency(account.credit) : ""}
              </TableCell>
            </TableRow>
          )
        })
        
        // Add a separator row after each type
        rows.push(
          <TableRow key={`separator-${type}`}>
            <TableCell colSpan={4} className="h-2 p-0">
              <Separator />
            </TableCell>
          </TableRow>
        )
      }
    })
    
    return rows
  }
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Trial Balance</CardTitle>
            <CardDescription>
              {data?.asOfDate && (
                <span>As of {formatDate(data.asOfDate)}</span>
              )}
              {data?.periodName && (
                <span> | Period: {data.periodName}</span>
              )}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList>
            <TabsTrigger value="by-date">By Date</TabsTrigger>
            <TabsTrigger value="by-period">By Period</TabsTrigger>
          </TabsList>
          <TabsContent value="by-date" className="pt-4">
            <div className="flex items-center mb-6">
              <p className="mr-2 text-sm font-medium">As of date:</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date instanceof Date) {
                        setSelectedDate(date)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>
          <TabsContent value="by-period" className="pt-4">
            <div className="flex items-center mb-6">
              <p className="mr-2 text-sm font-medium">Financial period:</p>
              <Select 
                value={selectedPeriod || ""} 
                onValueChange={setSelectedPeriod}
                disabled={isLoading || periods.length === 0}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({format(new Date(period.startDate), "MMM d")} - {format(new Date(period.endDate), "MMM d, yyyy")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="rounded-md border">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead className="w-[120px]">Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead className="text-right w-[200px]">Debit</TableHead>
                  <TableHead className="text-right w-[200px]">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-96 text-center">
                      Loading trial balance data...
                    </TableCell>
                  </TableRow>
                ) : !data ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-96 text-center">
                      No trial balance data available. Select a date or period.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {renderAccountRows()}
                    <TableRow className="bg-muted font-bold">
                      <TableCell colSpan={2} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(data.totals.debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(data.totals.credit)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <div>
          {data?.accounts && (
            <span>Showing {data.accounts.length} accounts</span>
          )}
        </div>
        <div>
          {data?.asOfDate && (
            <span>Report generated: {format(new Date(), "PPP p")}</span>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 