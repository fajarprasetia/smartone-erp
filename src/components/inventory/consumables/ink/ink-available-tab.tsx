"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Search, RefreshCw, AlertCircle, Printer } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import JsBarcode from "jsbarcode"

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
import { Badge } from "@/components/ui/badge"
import { AddInkForm } from "./add-ink-form"

interface InkStock {
  id: string;
  barcode_id: string;
  supplier: string;
  type: string;
  ink_type: string;
  color: string;
  quantity: string;
  unit: string;
  notes: string;
  user_name: string;
  date_added: string;
  availability: string;
}

export function InkAvailableTab() {
  const [inkStocks, setInkStocks] = useState<InkStock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isError, setIsError] = useState<string | null>(null)
  const [showAddInkForm, setShowAddInkForm] = useState(false)
  const [editingInk, setEditingInk] = useState<InkStock | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [printFrameRef, setPrintFrameRef] = useState<HTMLIFrameElement | null>(null);

  // Fetch available ink stocks
  const fetchInkStocks = async () => {
    setIsLoading(true)
    setIsError(null)
    
    try {
      const response = await fetch('/api/inventory/ink-stock?availability=YES')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Error: ${response.status}`)
      }
      
      const data = await response.json()
      setInkStocks(data)
    } catch (error) {
      console.error("Error fetching ink stocks:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load ink stocks"
      setIsError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Load data when component mounts
  useEffect(() => {
    fetchInkStocks()
  }, [])

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd MMM yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  // Handle adding new ink
  const handleAddInk = async (data: any) => {
    try {
      const response = await fetch('/api/inventory/ink-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to add ink')
      }
      
      toast.success("Ink added successfully")
      fetchInkStocks() // Refresh the list
      return Promise.resolve()
    } catch (error) {
      console.error("Error adding ink:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add ink")
      return Promise.reject(error)
    }
  }

  // Handle updating ink
  const handleUpdateInk = async (data: any) => {
    if (!editingInk) return;
    
    try {
      const response = await fetch(`/api/inventory/ink-stock/${editingInk.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to update ink')
      }
      
      toast.success("Ink updated successfully")
      fetchInkStocks() // Refresh the list
      setEditingInk(null)
      return Promise.resolve()
    } catch (error) {
      console.error("Error updating ink:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update ink")
      return Promise.reject(error)
    }
  }

  // Filter stocks by search query
  const filteredStocks = inkStocks.filter(stock => 
    (stock.barcode_id?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.supplier?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.type?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.color?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (stock.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  )

  // Handle print selected items
  const handlePrintSelected = () => {
    const selectedInks = inkStocks.filter(stock => selectedItems.has(stock.id))
    if (selectedInks.length === 0) {
      toast.error("Please select items to print")
      return
    }
    
    // Create print content for all selected items
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Barcodes</title>
        <style>
          @page {
            size: 35mm 25mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
          .barcode-container {
            width: 35mm;
            height: 25mm;
            padding: 1mm;
            box-sizing: border-box;
            position: relative;
            page-break-after: always;
          }
          .ink-type {
            font-size: 7pt;
            font-weight: bold;
            text-align: center;
          }
          .barcode-image {
            width: 100%;
            height: 7mm;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .barcode-id {
            font-size: 3pt;
            font-weight: bold;
            text-align: center;
          }
          .supplier {
            font-size: 5pt;
            text-align: center;
            margin-bottom: 1mm;
          }
          .color-box {
            position: absolute;
            bottom: 3mm;
            left: 1mm;
            width: 10mm;
            height: 10mm;
            border: 0.5pt solid black;
            font-size: 30pt;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .date {
            position: absolute;
            bottom: 3mm;
            left: 50%;
            transform: translateX(-50%);
            font-size: 5pt;
            font-weight: bold;
            text-align: center;
          }
          .quantity {
            position: absolute;
            bottom: 7mm;
            right: 1mm;
            font-size: 6pt;
            font-weight: bold;
            text-align: right;
          }
          .color-name {
            position: absolute;
            bottom: 3mm;
            right: 1mm;
            font-size: 7pt;
            font-weight: bold;
            text-align: right;
          }
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </head>
      <body>
        ${selectedInks.map((stock, index) => `
          <div class="barcode-container">
            <div class="ink-type">${stock.type.toUpperCase()}</div>
            <div class="barcode-image">
              <svg id="barcode-${index}"></svg>
            </div>
            <div class="barcode-id">${stock.barcode_id}</div>
            <div class="supplier">${stock.supplier || "SMARTONE"}</div>
            <div class="color-box">${stock.color ? stock.color.charAt(0).toUpperCase() : ""}</div>
            <div class="date">${format(new Date(stock.date_added), "dd-MM-yyyy")}</div>
            <div class="quantity">${stock.quantity} ${stock.unit.toUpperCase()}</div>
            <div class="color-name">${stock.color.toUpperCase()}</div>
          </div>
        `).join('')}

        <script>
          document.addEventListener('DOMContentLoaded', function () {
            ${selectedInks.map((stock, index) => `
              JsBarcode("#barcode-${index}", "${stock.barcode_id}", {
                format: "CODE128",
                width: 1,
                height: 30,
                displayValue: false,
                margin: 0,
                background: "#ffffff"
              });
            `).join('')}

            setTimeout(function () {
              window.print();
              setTimeout(function () {
                try {
                  window.close();
                } catch (e) {
                  console.log('Window close prevented by browser');
                }
              }, 1000);
            }, 500);
          });
        </script>
      </body>
      </html>
    `;

    // Use iframe method as fallback if window.open doesn't work
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      toast.success('Preparing barcodes for printing...');
    } else {
      // Fallback to iframe
      if (printFrameRef) {
        const iframe = printFrameRef;
        iframe.style.display = 'block';
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(printContent);
          iframeDoc.close();
          toast.success('Preparing barcodes for printing via iframe...');
        } else {
          throw new Error('Could not access iframe document');
        }
      } else {
        throw new Error('Print iframe not available');
      }
    }
  };

  // Handle item selection
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-red-500 font-medium">{isError}</p>
        <Button onClick={fetchInkStocks} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search ink stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Button variant="outline" size="icon" onClick={() => setSearchQuery("")}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchInkStocks} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {selectedItems.size > 0 && (
            <Button variant="outline" size="sm" onClick={handlePrintSelected}>
              <Printer className="h-4 w-4 mr-2" />
              Print Selected ({selectedItems.size})
            </Button>
          )}
          <Button onClick={() => setShowAddInkForm(true)}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Ink
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 sticky left-0 bg-muted/50 whitespace-nowrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedItems.size === inkStocks.length}
                  onChange={() => {
                    if (selectedItems.size === inkStocks.length) {
                      setSelectedItems(new Set())
                    } else {
                      setSelectedItems(new Set(inkStocks.map(stock => stock.id)))
                    }
                  }}
                />
              </TableHead>
              <TableHead className="sticky left-12 bg-muted/50 whitespace-nowrap">Barcode ID</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Ink Type</TableHead>
              <TableHead>Ink Color</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="sticky right-0 bg-muted/50 whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No ink stocks found
                </TableCell>
              </TableRow>
            ) : (
              filteredStocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="sticky left-0 bg-muted/50 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedItems.has(stock.id)}
                      onChange={() => handleSelectItem(stock.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium sticky left-12 bg-muted/80 whitespace-nowrap">{stock.barcode_id}</TableCell>
                  <TableCell>{stock.supplier || "N/A"}</TableCell>
                  <TableCell>{stock.type}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-0 bg-opacity-10" style={{ 
                      backgroundColor: `${getColorHex(stock.color.toLowerCase())}20`,
                      color: getColorHex(stock.color.toLowerCase())
                    }}>
                      {stock.color}
                    </Badge>
                  </TableCell>
                  <TableCell>{stock.quantity} {stock.unit}</TableCell>
                  <TableCell>{stock.user_name || "Unknown"}</TableCell>
                  <TableCell>{formatDate(stock.date_added)}</TableCell>
                  <TableCell className="max-w-xs truncate">{stock.notes || "N/A"}</TableCell>
                  <TableCell className="sticky right-0 bg-muted/80 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-2 text-xs"
                        onClick={() => setEditingInk(stock)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => handlePrintSelected()}
                      >
                        <Printer className="h-3 w-3 mr-1" /> Print
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Ink Form Dialog */}
      <AddInkForm
        open={showAddInkForm || !!editingInk}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddInkForm(false);
            setEditingInk(null);
          }
        }}
        onSubmit={editingInk ? handleUpdateInk : handleAddInk}
        initialData={editingInk || undefined}
      />

      {/* Hidden iframe for printing */}
      <iframe 
        ref={(el) => setPrintFrameRef(el)} 
        style={{ display: 'none' }}
      ></iframe>
    </div>
  )
}

// Helper function to convert color names to hex codes
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'yellow': '#FFFF00',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'white': '#FFFFFF',
    'orange': '#FFA500',
    'purple': '#800080',
    'brown': '#A52A2A',
    'gray': '#808080',
    'grey': '#808080',
    'pink': '#FFC0CB',
    'maroon': '#800000',
  }
  
  return colorMap[colorName] || '#666666' // Default color if not found
} 