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
      console.log("Fetching press in-progress orders...");
      
      // Use dedicated API route for press in-progress orders
      const response = await fetch("/api/production/orders/press-in-progress");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("API Response from press-in-progress endpoint:", data);
      
      // Set orders directly from the API response - no need to filter
      const pressOrders = Array.isArray(data) ? data : [];
      
      console.log("Press in-progress orders:", pressOrders);
      setOrders(pressOrders);
      setFilteredOrders(pressOrders);
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

  // Filter orders based on search query
  useEffect(() => {
    if (!Array.isArray(orders)) return;
    
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(order => 
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
          Orders currently in press process - filtered by status "PRESS"
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
                  <TableHead className="sticky left-0 bg-muted/50 whitespace-nowrap">SPK</TableHead>
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
                  <TableHead className="whitespace-nowrap">Waste</TableHead>
                  <TableHead className="sticky right-0 bg-muted/90 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium sticky left-0 bg-muted/50 whitespace-nowrap">{order.spk}</TableCell>
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
                    <TableCell className="whitespace-nowrap">{order.press_waste || ""}</TableCell>
                    <TableCell className="sticky right-0 bg-muted/90 whitespace-nowrap">
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
          open={isFormOpen}
          onOpenChange={() => handleFormClose()}
          onSuccess={handlePressCompleteSuccess}
        />
      )}
    </Card>
  );
} 