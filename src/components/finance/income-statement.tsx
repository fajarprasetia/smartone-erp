"use client"

import { useState, useEffect } from "react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Download, Printer, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface FinancialPeriod {
  id: string
  name: string
  startDate: string
  endDate: string
  isClosed: boolean
}

interface IncomeStatementAccount {
  id: string
  code: string
  name: string
  type: string
  balance: number
  children?: IncomeStatementAccount[]
}

interface IncomeStatementData {
  revenues: IncomeStatementAccount[]
  expenses: IncomeStatementAccount[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
  startDate: string
  endDate: string
  periodId?: string
  periodName?: string
  previousPeriodData?: {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
  }
}

export function IncomeStatement() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<IncomeStatementData | null>(null)
  const [periods, setPeriods] = useState<FinancialPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ 
    from: Date, 
    to: Date 
  }>({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(subMonths(new Date(), 1))
  })
  const [activeTab, setActiveTab] = useState<string>("by-date")
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["revenues", "expenses"]))
  const [showDetails, setShowDetails] = useState(true)
  const [compareToPrevious, setCompareToPrevious] = useState(true)
  
  useEffect(() => {
    // Fetch periods as soon as component mounts
    fetchPeriods()
  }, [])
  
  useEffect(() => {
    // Fetch income statement data when the selection changes
    if (activeTab === "by-date" && dateRange.from && dateRange.to) {
      fetchIncomeStatementByDateRange(dateRange.from, dateRange.to)
    } else if (activeTab === "by-period" && selectedPeriod) {
      fetchIncomeStatementByPeriod(selectedPeriod)
    }
  }, [activeTab, dateRange, selectedPeriod, compareToPrevious])
  
  const fetchPeriods = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/finance/periods")
      
      if (!response.ok) {
        throw new Error("Failed to fetch financial periods")
      }
      
      const data = await response.json()
      setPeriods(data.periods)
      
      // If there are periods, select the most recent one by default
      if (data.periods.length > 0) {
        setSelectedPeriod(data.periods[0].id) // Assuming periods are sorted by date desc
      }
    } catch (error) {
      console.error("Error fetching financial periods:", error)
      toast.error("Failed to load financial periods")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchIncomeStatementByDateRange = async (startDate: Date, endDate: Date) => {
    setIsLoading(true)
    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")
      
      let url = `/api/finance/reports/income-statement?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
      
      if (compareToPrevious) {
        url += "&compareToPrevious=true"
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch income statement")
      }
      
      const incomeStatementData = await response.json()
      setData(incomeStatementData)
    } catch (error) {
      console.error("Error fetching income statement:", error)
      toast.error("Failed to load income statement")
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchIncomeStatementByPeriod = async (periodId: string) => {
    setIsLoading(true)
    try {
      let url = `/api/finance/reports/income-statement?periodId=${periodId}`
      
      if (compareToPrevious) {
        url += "&compareToPrevious=true"
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error("Failed to fetch income statement")
      }
      
      const incomeStatementData = await response.json()
      setData(incomeStatementData)
    } catch (error) {
      console.error("Error fetching income statement:", error)
      toast.error("Failed to load income statement")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }
  
  const handleRefresh = () => {
    if (activeTab === "by-date") {
      fetchIncomeStatementByDateRange(dateRange.from, dateRange.to)
    } else {
      fetchIncomeStatementByPeriod(selectedPeriod!)
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
  
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? "∞" : "0%"
    
    const change = ((current - previous) / Math.abs(previous)) * 100
    return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`
  }
  
  const toggleSectionExpand = (section: string) => {
    const newExpandedSections = new Set(expandedSections)
    if (newExpandedSections.has(section)) {
      newExpandedSections.delete(section)
    } else {
      newExpandedSections.add(section)
    }
    setExpandedSections(newExpandedSections)
  }
  
  // Recursive function to render account rows
  const renderAccountRows = (accounts: IncomeStatementAccount[] | undefined, level = 0) => {
    if (!accounts || accounts.length === 0) return null
    
    return accounts.map(account => (
      <>
        <TableRow key={account.id}>
          <TableCell
            className={cn(
              "font-medium",
              level === 0 && "font-semibold",
              { "pl-4": level === 0, "pl-8": level === 1, "pl-12": level === 2 }
            )}
          >
            {account.name}
          </TableCell>
          <TableCell className={cn("text-right font-mono", level === 0 && "font-semibold")}>
            {formatCurrency(account.balance)}
          </TableCell>
          {data?.previousPeriodData && compareToPrevious && (
            <TableCell className="text-right text-muted-foreground text-xs">
              {/* This would need the previous period account data to show changes */}
              {/* Left as placeholder */}
            </TableCell>
          )}
        </TableRow>
        {showDetails && account.children && renderAccountRows(account.children, level + 1)}
      </>
    ))
  }
  
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Income Statement</CardTitle>
            <CardDescription>
              {data?.startDate && data?.endDate && (
                <span>
                  {formatDate(data.startDate)} - {formatDate(data.endDate)}
                </span>
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
            <TabsTrigger value="by-date">By Date Range</TabsTrigger>
            <TabsTrigger value="by-period">By Period</TabsTrigger>
          </TabsList>
          <TabsContent value="by-date" className="pt-4">
            <div className="flex items-center mb-6 flex-wrap gap-4">
              <div className="flex items-center">
                <p className="mr-2 text-sm font-medium">Date range:</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(value) => {
                        if (value?.from && value.to) {
                          setDateRange(value)
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-dashed",
                    compareToPrevious && "bg-muted"
                  )}
                  onClick={() => setCompareToPrevious(!compareToPrevious)}
                >
                  {compareToPrevious ? "Hide" : "Show"} Comparison
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="by-period" className="pt-4">
            <div className="flex items-center mb-6 flex-wrap gap-4">
              <div className="flex items-center">
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
              
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-dashed",
                    compareToPrevious && "bg-muted"
                  )}
                  onClick={() => setCompareToPrevious(!compareToPrevious)}
                >
                  {compareToPrevious ? "Hide" : "Show"} Comparison
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="rounded-md border">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right w-[200px]">Amount</TableHead>
                  {data?.previousPeriodData && compareToPrevious && (
                    <TableHead className="text-right w-[100px]">Change</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={compareToPrevious ? 3 : 2} className="h-96 text-center">
                      Loading income statement data...
                    </TableCell>
                  </TableRow>
                ) : !data ? (
                  <TableRow>
                    <TableCell colSpan={compareToPrevious ? 3 : 2} className="h-96 text-center">
                      No income statement data available. Select a date range or period.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Revenue Section */}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={compareToPrevious ? 3 : 2} className="py-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => toggleSectionExpand("revenues")}
                          className="p-0 h-auto font-bold text-base hover:bg-transparent"
                        >
                          Revenue
                          {expandedSections.has("revenues") ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {expandedSections.has("revenues") && (
                      <>
                        {renderAccountRows(data.revenues)}
                        <TableRow className="border-t border-muted">
                          <TableCell className="font-bold">Total Revenue</TableCell>
                          <TableCell className="text-right font-bold font-mono">
                            {formatCurrency(data.totalRevenue)}
                          </TableCell>
                          {data.previousPeriodData && compareToPrevious && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded",
                                data.totalRevenue > data.previousPeriodData.totalRevenue
                                  ? "bg-green-50 text-green-700"
                                  : data.totalRevenue < data.previousPeriodData.totalRevenue
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-50 text-gray-700"
                              )}>
                                {calculatePercentageChange(data.totalRevenue, data.previousPeriodData.totalRevenue)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      </>
                    )}
                    
                    {/* Expenses Section */}
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={compareToPrevious ? 3 : 2} className="py-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => toggleSectionExpand("expenses")}
                          className="p-0 h-auto font-bold text-base hover:bg-transparent"
                        >
                          Expenses
                          {expandedSections.has("expenses") ? (
                            <ChevronUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ChevronDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                    
                    {expandedSections.has("expenses") && (
                      <>
                        {renderAccountRows(data.expenses)}
                        <TableRow className="border-t border-muted">
                          <TableCell className="font-bold">Total Expenses</TableCell>
                          <TableCell className="text-right font-bold font-mono">
                            {formatCurrency(data.totalExpenses)}
                          </TableCell>
                          {data.previousPeriodData && compareToPrevious && (
                            <TableCell className="text-right">
                              <span className={cn(
                                "text-xs font-medium px-2 py-1 rounded",
                                data.totalExpenses < data.previousPeriodData.totalExpenses
                                  ? "bg-green-50 text-green-700"
                                  : data.totalExpenses > data.previousPeriodData.totalExpenses
                                  ? "bg-red-50 text-red-700"
                                  : "bg-gray-50 text-gray-700"
                              )}>
                                {calculatePercentageChange(data.totalExpenses, data.previousPeriodData.totalExpenses)}
                              </span>
                            </TableCell>
                          )}
                        </TableRow>
                      </>
                    )}
                    
                    {/* Net Income */}
                    <TableRow className="bg-muted font-bold text-lg">
                      <TableCell>Net Income</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(data.netIncome)}
                      </TableCell>
                      {data.previousPeriodData && compareToPrevious && (
                        <TableCell className="text-right">
                          <span className={cn(
                            "text-xs font-medium px-2 py-1 rounded",
                            data.netIncome > data.previousPeriodData.netIncome
                              ? "bg-green-50 text-green-700"
                              : data.netIncome < data.previousPeriodData.netIncome
                              ? "bg-red-50 text-red-700"
                              : "bg-gray-50 text-gray-700"
                          )}>
                            {calculatePercentageChange(data.netIncome, data.previousPeriodData.netIncome)}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? "Hide" : "Show"} Details
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 text-xs text-muted-foreground">
        <div>
          {data && (
            <span>
              This report includes {showDetails ? "detailed" : "summarized"} financial information for the selected period.
            </span>
          )}
        </div>
        <div>
          <span>Report generated: {format(new Date(), "PPP p")}</span>
        </div>
      </CardFooter>
    </Card>
  )
} 