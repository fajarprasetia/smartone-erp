"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

// Define interfaces
interface PaperStock {
  id: string
  qrCode: string | null
  manufacturer: string | null
  type: string
  gsm: number
  width: number
  length: number
  height: number
  remainingLength: number | null
  dateAdded: string
  dateTaken: string | null
  addedByUserId: string
  takenByUserId: string | null
  notes: string | null
  availability: "YES" | "NO"
  user_name?: string
  taker_name?: string
}

export function PaperStocksOutTab() {
  const [paperStocks, setPaperStocks] = useState<PaperStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch paper stocks that are out (availability = NO)
  const fetchPaperStocks = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/inventory/paper?availability=NO&include_users=true');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || `Error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setPaperStocks(data);
    } catch (error) {
      console.error("Error fetching out-of-stock paper:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load out-of-stock paper");
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    fetchPaperStocks();
  }, []);

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Filter stocks by search query
  const filteredStocks = paperStocks.filter(stock => 
    (stock.qrCode?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.manufacturer?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.gsm?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.width?.toString().toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.taker_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search out-of-stock paper..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" onClick={fetchPaperStocks}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Added</TableHead>
              <TableHead>Date Taken</TableHead>
              <TableHead>Barcode ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Paper Type</TableHead>
              <TableHead>GSM</TableHead>
              <TableHead>Width</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Remaining Length</TableHead>
              <TableHead>Added by</TableHead>
              <TableHead>Taken by</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-6 text-muted-foreground">
                  No out-of-stock paper found
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell>{formatDate(stock.dateAdded)}</TableCell>
                  <TableCell>{formatDate(stock.dateTaken)}</TableCell>
                  <TableCell>{stock.qrCode || "N/A"}</TableCell>
                  <TableCell>{stock.manufacturer || "N/A"}</TableCell>
                  <TableCell>{stock.type || "N/A"}</TableCell>
                  <TableCell>{stock.gsm}</TableCell>
                  <TableCell>{stock.width}</TableCell>
                  <TableCell>{stock.length}</TableCell>
                  <TableCell>{stock.remainingLength || "0"}</TableCell>
                  <TableCell>{stock.user_name || "N/A"}</TableCell>
                  <TableCell>{stock.taker_name || "N/A"}</TableCell>
                  <TableCell className="max-w-xs truncate">{stock.notes || "N/A"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 