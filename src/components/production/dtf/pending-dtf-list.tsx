"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Search, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import DTFStartForm from "./dtf-start-form";

interface Order {
  id: string;
  spk: string;
  customer: {
    name: string;
    nama?: string; // Support both formats
  };
  produk: string;
  status: string;
  prioritas: number;
  created_at: string;
  est_order: string;
  tgl_dtf: string;
  capture?: string; // Add design preview field
}

interface PendingDTFListProps {
  onOrderProcessed?: () => void;
}

export function PendingDTFList({ onOrderProcessed }: PendingDTFListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [startDTFDialogOpen, setStartDTFDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchPendingDTFOrders();
  }, []);

  // Filter orders based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(
      (order) =>
        order.spk?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.nama?.toLowerCase().includes(query) ||
        order.produk?.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Fetch pending DTF orders from API
  async function fetchPendingDTFOrders() {
    setIsLoading(true);
    setError(null);
    try {
      // Try dedicated DTF ready endpoint first
      let response = await fetch("/api/dtf/ready-orders");
      
      // Fallback to generic endpoint if dedicated endpoint fails
      if (!response.ok) {
        console.log("Dedicated DTF ready API not available, trying generic endpoint");
        response = await fetch("/api/orders/pending-dtf");
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch pending DTF orders");
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} orders`);
      
      // Get orders with any customer data
      const ordersWithCustomers = data.filter((order: any) => order && order.id);
      
      // Process orders with flexible status matching
      const dtfReadyOrders = ordersWithCustomers.filter((order: any) => {
        // Get the status and normalize it
        const status = String(order.status || "").trim().toUpperCase();
        
        // Log all orders with DTF in the status for debugging
        if (status.includes("DTF")) {
          console.log(`Found potential DTF order: ${order.spk} - Status: "${order.status}"`);
        }
        
        // Match "DTF READY" with flexible conditions
        return status === "DTF READY" || 
              status === "DTFREADY" ||
              status === "DTF-READY" ||
              (status.includes("DTF") && status.includes("READY"));
      });
      
      console.log(`Found ${dtfReadyOrders.length} orders with DTF READY status`);
      
      // Clean up and standardize the data
      const mappedData = dtfReadyOrders.map((order: any) => {
        // Log the exact order data for the one we know exists
        if (order.id === "cm9vl2zle00003ipobc874i86") {
          console.log("Found order by ID cm9vl2zle00003ipobc874i86:", { 
            spk: order.spk,
            status: order.status,
            raw: order
          });
        }
        
        return {
          ...order,
          // Handle potential missing customer data
          customer: {
            name: order.customer?.nama || "N/A",
            nama: order.customer?.nama
          },
          // Ensure other fields exist and have default values
          prioritas: order.prioritas || 0,
          produk: order.produk || "Unknown product",
          status: order.status || "N/A",
          spk: order.spk || "No SPK"
        };
      });
      
      // Sort by priority and then creation date
      const sortedData = [...mappedData].sort((a, b) => {
        // First by priority (lower number = higher priority)
        const priorityA = Number(a.prioritas) || 999;
        const priorityB = Number(b.prioritas) || 999;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Then by creation date (newest first)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      
      setOrders(sortedData);
      setFilteredOrders(sortedData);
      
      // If we found zero orders, show an error
      if (sortedData.length === 0) {
        setError(`No DTF READY orders found (checked ${data.length} orders)`);
      }
    } catch (error) {
      console.error("Error fetching pending DTF orders:", error);
      setError("Failed to load pending DTF orders");
      toast.error("Failed to load pending DTF orders");
    } finally {
      setIsLoading(false);
    }
  }

  // Handle starting DTF process
  function handleStartDTF(order: Order) {
    setSelectedOrder(order);
    setStartDTFDialogOpen(true);
  }

  // Get priority badge color
  function getPriorityColorClass(priority?: number) {
    if (priority === undefined || priority === null) return "bg-gray-500";
    
    switch (priority) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-green-500";
      case 5:
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  }

  // Format date as relative time
  function formatDate(dateString?: string) {
    if (!dateString) return "N/A";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      console.warn("Invalid date format:", dateString);
      return "Invalid date";
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending DTF</CardTitle>
          <CardDescription>Orders with "DTF READY" status</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by SPK, customer, or product..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchPendingDTFOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="text-center sticky left-0 bg-card">SPK</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right sticky right-0 bg-card">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isLoading
                    ? "Loading pending DTF orders..."
                    : "No orders with 'DTF READY' status found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.created_at ? formatDate(order.created_at) : "N/A"}
                  </TableCell>
                  <TableCell className="font-medium text-center sticky left-0 bg-card">{order.spk}</TableCell>
                  <TableCell>{order.customer?.name || order.customer?.nama || "N/A"}</TableCell>
                  <TableCell>{order.produk}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColorClass(order.prioritas)}>
                      {order.prioritas || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.est_order ? formatDate(order.est_order) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right sticky right-0 bg-card">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStartDTF(order)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* DTF Start Dialog */}
      <Dialog open={startDTFDialogOpen} onOpenChange={setStartDTFDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Start DTF Process</DialogTitle>
          {selectedOrder && (
            <DTFStartForm
              order={selectedOrder}
              open={startDTFDialogOpen}
              onOpenChange={setStartDTFDialogOpen}
              onSuccess={() => {
                setStartDTFDialogOpen(false);
                fetchPendingDTFOrders();
                if (onOrderProcessed) onOrderProcessed();
                toast.success("DTF process started successfully");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 