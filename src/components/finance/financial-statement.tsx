"use client"

import { useState } from "react"
import { format } from "date-fns"
import { 
  Download, 
  Share2, 
  Printer, 
  ZoomIn, 
  ZoomOut,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatCurrency } from "@/lib/utils"

// Types
interface StatementPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date
}

interface StatementAccount {
  code: string
  name: string
  amount: number
  percentage?: number
  subAccounts?: StatementAccount[]
}

interface StatementSection {
  title: string
  accounts: StatementAccount[]
  total: number
  percentage?: number
}

interface FinancialStatementData {
  incomeStatement: {
    periods: StatementPeriod[]
    revenue: StatementSection
    expenses: StatementSection
    netIncome: number
    netIncomePercentage?: number
  }
  balanceSheet: {
    periods: StatementPeriod[]
    assets: StatementSection
    liabilities: StatementSection
    equity: StatementSection
  }
  cashFlow: {
    periods: StatementPeriod[]
    operating: StatementSection
    investing: StatementSection
    financing: StatementSection
    netCashFlow: number
  }
}

interface FinancialStatementProps {
  data: FinancialStatementData
  selectedPeriodId?: string
  comparisonPeriodId?: string
  showComparison?: boolean
}

export function FinancialStatement({
  data,
  selectedPeriodId,
  comparisonPeriodId,
  showComparison = false,
}: FinancialStatementProps) {
  const [activeTab, setActiveTab] = useState<string>("income-statement")
  const [zoom, setZoom] = useState<number>(100)
  
  const selectedPeriod = data.incomeStatement.periods.find(p => p.id === selectedPeriodId) || 
                         data.incomeStatement.periods[0]
  
  const comparisonPeriod = showComparison && comparisonPeriodId ? 
                           data.incomeStatement.periods.find(p => p.id === comparisonPeriodId) : 
                           undefined
  
  // Handler for printing
  const handlePrint = () => {
    window.print()
  }
  
  // Handler for download
  const handleDownload = () => {
    // Implementation would depend on your backend capabilities
    // Typically you'd call an API endpoint that generates a PDF or Excel file
    alert("Download functionality will be implemented based on backend capabilities")
  }
  
  // Handler for sharing
  const handleShare = () => {
    // Implementation would depend on your requirements
    // Could show a dialog with a shareable link, email options, etc.
    alert("Share functionality will be implemented based on requirements")
  }
  
  // Handler for zoom in
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 150))
  }
  
  // Handler for zoom out
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 70))
  }
  
  // Render a collapsible account row with subaccounts if they exist
  const renderAccountRow = (account: StatementAccount, isSubAccount = false) => {
    const hasSubAccounts = account.subAccounts && account.subAccounts.length > 0
    
    return (
      <>
        {hasSubAccounts ? (
          <Collapsible defaultOpen>
            <TableRow className={isSubAccount ? "bg-muted/30" : ""}>
              <TableCell className={cn("font-medium", isSubAccount && "pl-6")}>
                <CollapsibleTrigger className="flex items-center">
                  {hasSubAccounts ? <ChevronDown className="h-4 w-4 mr-2" /> : null}
                  {account.code} - {account.name}
                </CollapsibleTrigger>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(account.amount)}
              </TableCell>
              {account.percentage !== undefined && (
                <TableCell className="text-right w-24">
                  {account.percentage.toFixed(1)}%
                </TableCell>
              )}
              {showComparison && (
                <>
                  <TableCell className="text-right">
                    {/* Would show comparison value here */}
                    {formatCurrency(0)}
                  </TableCell>
                  <TableCell className="text-right w-24">
                    {/* Would show variance % here */}
                    0.0%
                  </TableCell>
                </>
              )}
            </TableRow>
            <CollapsibleContent>
              {account.subAccounts?.map((subAccount, index) => (
                <TableRow key={index} className="bg-muted/20">
                  <TableCell className="pl-10 font-medium">
                    {subAccount.code} - {subAccount.name}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(subAccount.amount)}
                  </TableCell>
                  {subAccount.percentage !== undefined && (
                    <TableCell className="text-right w-24">
                      {subAccount.percentage.toFixed(1)}%
                    </TableCell>
                  )}
                  {showComparison && (
                    <>
                      <TableCell className="text-right">
                        {/* Would show comparison value here */}
                        {formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right w-24">
                        {/* Would show variance % here */}
                        0.0%
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <TableRow className={isSubAccount ? "bg-muted/30" : ""}>
            <TableCell className={cn("font-medium", isSubAccount && "pl-6")}>
              {account.code} - {account.name}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(account.amount)}
            </TableCell>
            {account.percentage !== undefined && (
              <TableCell className="text-right w-24">
                {account.percentage.toFixed(1)}%
              </TableCell>
            )}
            {showComparison && (
              <>
                <TableCell className="text-right">
                  {/* Would show comparison value here */}
                  {formatCurrency(0)}
                </TableCell>
                <TableCell className="text-right w-24">
                  {/* Would show variance % here */}
                  0.0%
                </TableCell>
              </>
            )}
          </TableRow>
        )}
      </>
    )
  }
  
  // Render a section (e.g., Revenue, Expenses)
  const renderSection = (section: StatementSection) => {
    return (
      <>
        <TableRow className="bg-muted">
          <TableCell className="font-bold">{section.title}</TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(section.total)}
          </TableCell>
          {section.percentage !== undefined && (
            <TableCell className="text-right font-bold w-24">
              {section.percentage.toFixed(1)}%
            </TableCell>
          )}
          {showComparison && (
            <>
              <TableCell className="text-right font-bold">
                {/* Would show comparison value here */}
                {formatCurrency(0)}
              </TableCell>
              <TableCell className="text-right font-bold w-24">
                {/* Would show variance % here */}
                0.0%
              </TableCell>
            </>
          )}
        </TableRow>
        {section.accounts.map((account, index) => (
          renderAccountRow(account)
        ))}
      </>
    )
  }
  
  return (
    <div>
      <div className="print:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Financial Statements</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="flex items-center px-2">{zoom}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:py-2">
          <CardTitle className="text-center">
            SmartOne ERP
          </CardTitle>
          <CardDescription className="text-center">
            {activeTab === "income-statement" && "Income Statement"}
            {activeTab === "balance-sheet" && "Balance Sheet"}
            {activeTab === "cash-flow" && "Cash Flow Statement"}
            <div>
              For the period {format(new Date(selectedPeriod.startDate), "dd MMM yyyy")} to {format(new Date(selectedPeriod.endDate), "dd MMM yyyy")}
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent style={{ zoom: `${zoom}%` }}>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="print:hidden"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="income-statement">Income Statement</TabsTrigger>
              <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="income-statement">
              <ScrollArea className="h-[600px] print:h-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right w-24">% Revenue</TableHead>
                      {showComparison && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right w-24">Variance %</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderSection(data.incomeStatement.revenue)}
                    
                    {renderSection(data.incomeStatement.expenses)}
                    
                    <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                      <TableCell>Net Income</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.incomeStatement.netIncome)}
                      </TableCell>
                      <TableCell className="text-right w-24">
                        {data.incomeStatement.netIncomePercentage?.toFixed(1)}%
                      </TableCell>
                      {showComparison && (
                        <>
                          <TableCell className="text-right">
                            {/* Would show comparison value here */}
                            {formatCurrency(0)}
                          </TableCell>
                          <TableCell className="text-right w-24">
                            {/* Would show variance % here */}
                            0.0%
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="balance-sheet">
              <ScrollArea className="h-[600px] print:h-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showComparison && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right w-24">Variance %</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderSection(data.balanceSheet.assets)}
                    
                    {renderSection(data.balanceSheet.liabilities)}
                    
                    {renderSection(data.balanceSheet.equity)}
                    
                    <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                      <TableCell>Total Liabilities and Equity</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.balanceSheet.liabilities.total + data.balanceSheet.equity.total)}
                      </TableCell>
                      {showComparison && (
                        <>
                          <TableCell className="text-right">
                            {/* Would show comparison value here */}
                            {formatCurrency(0)}
                          </TableCell>
                          <TableCell className="text-right w-24">
                            {/* Would show variance % here */}
                            0.0%
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="cash-flow">
              <ScrollArea className="h-[600px] print:h-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {showComparison && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right w-24">Variance %</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderSection(data.cashFlow.operating)}
                    
                    {renderSection(data.cashFlow.investing)}
                    
                    {renderSection(data.cashFlow.financing)}
                    
                    <TableRow className="bg-primary/10 font-bold border-t-2 border-primary">
                      <TableCell>Net Cash Flow</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(data.cashFlow.netCashFlow)}
                      </TableCell>
                      {showComparison && (
                        <>
                          <TableCell className="text-right">
                            {/* Would show comparison value here */}
                            {formatCurrency(0)}
                          </TableCell>
                          <TableCell className="text-right w-24">
                            {/* Would show variance % here */}
                            0.0%
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between print:hidden">
          <div className="text-sm text-muted-foreground">
            Generated on {format(new Date(), "dd MMM yyyy, HH:mm")}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 