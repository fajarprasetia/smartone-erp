"use client"

import { useState, useEffect } from "react"
import { BarChart, FileSpreadsheet, DownloadCloud, AlertCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

// Define interfaces
interface PaperStockOverview {
  totalStocks: number
  availableStocks: number
  stocksOut: number
  pendingRequests: number
  recentlyAdded: number
  topGSM: {
    label: string
    count: number
    percentage: number
  }[]
  supplierDistribution: {
    label: string
    count: number
    percentage: number
  }[]
}

export function PaperStocksTab() {
  const [stocksOverview, setStocksOverview] = useState<PaperStockOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{id: string, name: string} | null>(null)

  // Fetch paper stocks overview
  const fetchStocksOverview = async () => {
    setIsLoading(true);
    setIsError(null);
    
    try {
      const response = await fetch("/api/inventory/paper-stock/overview");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error: ${response.status}`);
      }
      
      const data = await response.json();
      setStocksOverview(data);
    } catch (error) {
      console.error("Error fetching paper stocks overview:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load paper stocks overview";
      setIsError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDelete = (id: string, name: string) => {
    setSelectedItem({id, name});
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/inventory/paper-stock/${selectedItem.id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error: ${response.status}`);
      }
      
      toast.success(`Successfully deleted ${selectedItem.name}`);
      setIsDeleteDialogOpen(false);
      fetchStocksOverview(); // Refresh the data
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchStocksOverview();
  }, []);

  const handleExportInventory = () => {
    // Placeholder for export functionality
    toast.info("Export functionality will be implemented soon");
  };

  const handleImportInventory = () => {
    // Placeholder for import functionality
    toast.info("Import functionality will be implemented soon");
  };

  if (isError) {
    return (
      <Card className="h-80">
        <CardContent className="flex flex-col items-center justify-center h-full gap-4 py-10">
          <AlertCircle className="h-10 w-10 text-red-500"/>
          <p className="text-red-500 font-medium">{isError}</p>
          <Button onClick={fetchStocksOverview} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paper Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stocksOverview?.totalStocks || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              All paper stocks in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stocksOverview?.availableStocks || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Currently available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stocks Out</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stocksOverview?.stocksOut || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Depleted stocks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stocksOverview?.pendingRequests || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GSM Distribution</CardTitle>
            <CardDescription>
              Paper stocks by GSM type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : stocksOverview?.topGSM && stocksOverview.topGSM.length > 0 ? (
              stocksOverview.topGSM.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count} stocks</span>
                  </div>
                  <Progress value={item.percentage} />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No GSM data available
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleExportInventory} disabled={isLoading}>
              <BarChart className="h-4 w-4 mr-2" /> View Detailed Report
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Supplier Distribution</CardTitle>
            <CardDescription>
              Paper stocks by supplier
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </>
            ) : stocksOverview?.supplierDistribution && stocksOverview.supplierDistribution.length > 0 ? (
              stocksOverview.supplierDistribution.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate max-w-56">{item.label}</span>
                    <span className="font-medium">{item.count} stocks</span>
                  </div>
                  <Progress value={item.percentage} />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No supplier data available
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleExportInventory} disabled={isLoading}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> Export to Excel
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Stock Management</CardTitle>
            <CardDescription>
              Tools for managing paper inventory
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStocksOverview} 
            disabled={isLoading}
            className="hidden sm:flex"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleImportInventory} disabled={isLoading}>
            <DownloadCloud className="h-4 w-4 mr-2" /> Import Inventory Data
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={handleExportInventory} disabled={isLoading}>
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Export Inventory Report
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center">
              <AlertCircle className="h-5 w-5 text-destructive mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="mt-4 p-4 border rounded-md bg-muted/30">
              <p className="text-sm"><span className="font-medium">Item:</span> {selectedItem.name}</p>
              <p className="text-sm mt-1 text-muted-foreground">Deleting this item will permanently remove it from the database.</p>
            </div>
          )}
          
          <DialogFooter className="mt-6 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isLoading}
              className="bg-background/50 hover:bg-background/70"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={isLoading}
              className="bg-destructive/90 hover:bg-destructive"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent"></span>
                  Deleting...
                </>
              ) : (
                <>Delete Item</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 