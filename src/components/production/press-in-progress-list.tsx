"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PressDoneForm } from "./press-done-form";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  spk: string;
  customer?: {
    nama: string;
  };
  nama_pesanan: string;
  produk?: string;
  prioritas?: string;
  est_order?: Date;
  status: string;
  tgl_press?: Date;
  press_mesin?: string;
  press_setting?: string;
  prints_qty?: string;
  press_suhu?: string;
  press_presure?: string;
  press_speed?: number;
  press_protect?: string;
  total_kain?: string;
  press_bagus?: string;
  press_reject?: string;
  press_waste?: string;
  press?: {
    name: string;
  };
}

interface PressInProgressListProps {
  onPressComplete: () => void;
}

// Helper function to display dates or empty string instead of N/A
const displayDate = (date?: Date | string | null) => {
  if (!date) return "";
  try {
    return formatDate(new Date(date));
  } catch (error) {
    return "";
  }
};

// Helper function to get priority color class
const getPriorityColorClass = (priority?: string) => {
  if (!priority) return "";
  switch (priority.toLowerCase()) {
    case 'high':
    case 'tinggi':
      return "text-red-600 font-semibold";
    case 'medium':
    case 'sedang':
      return "text-orange-500";
    case 'low':
    case 'rendah':
      return "text-green-600";
    default:
      return "";
  }
};

export function PressInProgressList({ onPressComplete }: PressInProgressListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch orders with "PRESS" status
  async function fetchPressInProgressOrders() {
    setLoading(true);
    try {
      console.log("Fetching orders with PRESS status...");
      let response;
      let data;
      
      try {
        // First try the dedicated status endpoint
        response = await fetch("/api/orders/status?status=PRESS");
        
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.status}`);
        }
        
        data = await response.json();
        console.log("API Response from status endpoint:", data);
      } catch (error) {
        console.warn("Dedicated status endpoint failed, trying fallback:", error);
        
        // Fallback to the main orders endpoint
        response = await fetch("/api/orders?status=PRESS");
        
        if (!response.ok) {
          throw new Error(`Error fetching orders from fallback: ${response.status}`);
        }
        
        data = await response.json();
        console.log("API Response from fallback endpoint:", data);
      }
      
      // The new endpoint returns the array directly, but we'll keep the check for robustness
      let ordersData: Order[] = [];
      if (Array.isArray(data)) {
        console.log("Data is an array");
        ordersData = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.orders)) {
        console.log("Data has orders array property");
        ordersData = data.orders;
      } else {
        console.error("Unexpected data format:", data);
        throw new Error("Received unexpected data format from API");
      }
      
      // Filter out "PRINT ONLY" and "CUTTING ONLY" orders
      ordersData = ordersData.filter(order => {
        const produk = (order.produk || "").toUpperCase();
        return produk !== "PRINT ONLY" && produk !== "CUTTING ONLY";
      });
      
      console.log("Orders to display:", ordersData);
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch press in progress orders:", err);
      setError("Failed to load orders. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load press in progress orders",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPressInProgressOrders();
  }, []);

  // Filter orders based on search query and exclude PRINT ONLY and CUTTING ONLY
  useEffect(() => {
    if (!Array.isArray(orders)) return;
    
    // First filter by product type
    const filteredByProductType = orders.filter(order => {
      const produk = (order.produk || "").toUpperCase();
      return produk !== "PRINT ONLY" && produk !== "CUTTING ONLY";
    });
    
    // Then apply search filter if needed
    if (!searchQuery.trim()) {
      setFilteredOrders(filteredByProductType);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = filteredByProductType.filter(order => 
        order.spk?.toLowerCase().includes(query) ||
        order.customer?.nama?.toLowerCase().includes(query) ||
        order.produk?.toLowerCase().includes(query) ||
        order.nama_pesanan?.toLowerCase().includes(query) ||
        order.press?.name?.toLowerCase().includes(query) ||
        order.press_mesin?.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [orders, searchQuery]);

  const handleCompleteClick = (order: Order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
  };

  const handlePressCompleteSuccess = () => {
    fetchPressInProgressOrders();
    onPressComplete();
    setIsFormOpen(false);
    setSelectedOrder(null);
    toast({
      title: "Success",
      description: "Press job has been marked as completed",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Press In Progress</CardTitle>
        <CardDescription>
          Orders that are currently in press process (PRESS status)
        </CardDescription>
        {/* Add search bar */}
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchPressInProgressOrders()}
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : !Array.isArray(orders) ? (
          <div className="text-center text-red-500 p-4">Invalid data received from server</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No orders currently in press
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="whitespace-nowrap">SPK</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Priority</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="whitespace-nowrap">Operator</TableHead>
                  <TableHead className="whitespace-nowrap">Machine</TableHead>
                  <TableHead className="whitespace-nowrap">Temperature</TableHead>
                  <TableHead className="whitespace-nowrap">Pressure</TableHead>
                  <TableHead className="whitespace-nowrap">Speed</TableHead>
                  <TableHead className="whitespace-nowrap">Protect</TableHead>
                  <TableHead className="whitespace-nowrap">Fabric Used</TableHead>
                  <TableHead className="whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="whitespace-nowrap">Good (ACC)</TableHead>
                  <TableHead className="whitespace-nowrap">Rejected</TableHead>
                  <TableHead className="whitespace-nowrap">Waste</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium whitespace-nowrap">{order.spk}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.customer?.nama || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.produk || order.nama_pesanan || ""}>
                      {order.produk === "PRESS ONLY" ? (
                        <span className="font-semibold text-blue-600">PRESS ONLY</span>
                      ) : (
                        order.produk || order.nama_pesanan || ""
                      )}
                    </TableCell>
                    <TableCell className={`whitespace-nowrap ${getPriorityColorClass(order.prioritas)}`}>
                      {order.prioritas || ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {displayDate(order.tgl_press)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {displayDate(order.est_order)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.press?.name || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_mesin || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_suhu || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_presure || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_speed || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_protect || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.total_kain || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.prints_qty || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_bagus || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_reject || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.press_waste || ""}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCompleteClick(order)}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {isFormOpen && selectedOrder && (
        <PressDoneForm
          order={selectedOrder}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handlePressCompleteSuccess}
        />
      )}
    </Card>
  );
} 