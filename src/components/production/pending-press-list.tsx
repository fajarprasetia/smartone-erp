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
import { PressForm } from "./press-form";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  spk: string;
  tanggal?: Date;
  kategori?: string;
  customer?: {
    nama: string;
  };
  prioritas?: string;
  est_order?: Date;
  status: string;
  statusprod?: string;
  produk?: string;
  asal_bahan?: string;
  asal_bahan_id?: string;
  originalCustomer?: {
    id: string;
    nama: string;
  };
  nama_kain?: string;
  lebar_kain?: string;
  warna_acuan?: string;
  tgl_print?: Date;
  tgl_print_done?: Date;
  press_mesin?: string;
  press_presure?: string;
  press_id?: string;
}

interface PendingPressListProps {
  onPressStart: () => void;
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

export function PendingPressList({ onPressStart }: PendingPressListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch orders with "PRINT DONE" status
  async function fetchPendingPressOrders() {
    setLoading(true);
    try {
      console.log("Fetching orders with PRINT DONE status...");
      let response;
      let data;
      
      try {
        // First try the dedicated status endpoint
        response = await fetch("/api/orders/status?status=PRINT%20DONE");
        
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.status}`);
        }
        
        data = await response.json();
        console.log("API Response from status endpoint:", data);
      } catch (error) {
        console.warn("Dedicated status endpoint failed, trying fallback:", error);
        
        // Fallback to the main orders endpoint
        response = await fetch("/api/orders?status=PRINT%20DONE");
        
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
      console.error("Failed to fetch pending press orders:", err);
      setError("Failed to load orders. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pending press orders",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPendingPressOrders();
  }, []);

  // Filter orders when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = orders.filter(order => 
      order.spk?.toLowerCase().includes(query) ||
      order.customer?.nama?.toLowerCase().includes(query) ||
      order.produk?.toLowerCase().includes(query) ||
      order.nama_kain?.toLowerCase().includes(query) ||
      order.status?.toLowerCase().includes(query) ||
      order.statusprod?.toLowerCase().includes(query) ||
      order.originalCustomer?.nama?.toLowerCase().includes(query) ||
      order.asal_bahan?.toLowerCase().includes(query)
    );
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Filter out PRINT ONLY and CUTTING ONLY products
  useEffect(() => {
    const filteredByProductType = orders.filter(order => {
      const produk = (order.produk || "").toUpperCase();
      return produk !== "PRINT ONLY" && produk !== "CUTTING ONLY";
    });
    
    if (!searchQuery.trim()) {
      setFilteredOrders(filteredByProductType);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = filteredByProductType.filter(order => 
        order.spk?.toLowerCase().includes(query) ||
        order.customer?.nama?.toLowerCase().includes(query) ||
        order.produk?.toLowerCase().includes(query) ||
        order.nama_kain?.toLowerCase().includes(query) ||
        order.status?.toLowerCase().includes(query) ||
        order.statusprod?.toLowerCase().includes(query) ||
        order.originalCustomer?.nama?.toLowerCase().includes(query) ||
        order.asal_bahan?.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [orders, searchQuery]);

  const handlePressClick = (order: Order) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
  };

  const handlePressSuccess = () => {
    fetchPendingPressOrders();
    onPressStart();
    setIsFormOpen(false);
    setSelectedOrder(null);
    toast({
      title: "Success",
      description: "Order has been moved to Press status",
    });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Press</CardTitle>
        <CardDescription>
          Orders that are ready for press (PRINT DONE status)
        </CardDescription>
        
        {/* Search and filter section */}
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
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchPendingPressOrders()}
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
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            {searchQuery ? "No orders matching your search criteria" : "No orders pending for press"}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1400px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted/50 whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">SPK</TableHead>
                  <TableHead className="whitespace-nowrap">Category</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Priority</TableHead>
                  <TableHead className="whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Production Status</TableHead>
                  <TableHead className="whitespace-nowrap">Product</TableHead>
                  <TableHead className="whitespace-nowrap">Fabric Origin</TableHead>
                  <TableHead className="whitespace-nowrap">Fabric Name</TableHead>
                  <TableHead className="whitespace-nowrap">Fabric Width</TableHead>
                  <TableHead className="whitespace-nowrap">Color Matching</TableHead>
                  <TableHead className="whitespace-nowrap">Print Datetime</TableHead>
                  <TableHead className="sticky right-0 bg-muted/50 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="sticky left-0 bg-white whitespace-nowrap">
                      {displayDate(order.tanggal)}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{order.spk}</TableCell>
                    <TableCell>{order.kategori || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.customer?.nama || ""}>
                      {order.customer?.nama || ""}
                    </TableCell>
                    <TableCell className={getPriorityColorClass(order.prioritas)}>
                      {order.prioritas || ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {displayDate(order.est_order)}
                    </TableCell>
                    <TableCell>{order.status || ""}</TableCell>
                    <TableCell>{order.statusprod || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.produk || ""}>
                      {order.produk || ""}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" 
                      title={order.originalCustomer?.nama || order.asal_bahan || ""}>
                      {order.originalCustomer?.nama || order.asal_bahan || ""}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.nama_kain || ""}>
                      {order.nama_kain || ""}
                    </TableCell>
                    <TableCell>{order.lebar_kain || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.warna_acuan || ""}>
                      {order.warna_acuan || ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {order.tgl_print_done 
                        ? displayDate(order.tgl_print_done)
                        : displayDate(order.tgl_print)}
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePressClick(order)}
                      >
                        Press
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
        <PressForm
          order={selectedOrder}
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handlePressSuccess}
        />
      )}
    </Card>
  );
} 