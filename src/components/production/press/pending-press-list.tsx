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
import { PressForm } from "./press-form";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";

interface Order {
  id: string
  spk: string
  created_at?: Date | null
  kategori?: string
  customer?: {
    nama: string;
  }
  prioritas?: string
  est_order?: Date | null
  status: string
  statusprod?: string
  produk?: string
  asal_bahan_rel?: {
    nama: string
  }  
  nama_kain?: string
  lebar_kain?: number
  warna_acuan?: string
  tgl_print?: Date | null
  print_done?: Date | null
  press_mesin?: string
  press_presure?: string
  press_id?: string
  qty?: number
}

interface PendingPressListProps {
  onPressStart: () => void;
}

export function PendingPressList({ onPressStart }: PendingPressListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch orders with "PRESS READY" status
  async function fetchPendingPressOrders() {
    setLoading(true);
    try {
      console.log("Fetching pending press orders...");
      
      // Use dedicated endpoint instead of filtering on client side
      const response = await fetch("/api/production/orders/pending-press");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let pendingPressOrders: Order[] = [];
      if (Array.isArray(data)) {
        pendingPressOrders = data;
      } else if (data && typeof data === 'object' && Array.isArray(data.orders)) {
        pendingPressOrders = data.orders;
      }          
      
      console.log("Pending press orders:", pendingPressOrders);
      
      setOrders(pendingPressOrders);
      setFilteredOrders(pendingPressOrders);
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

  // Parse and format date strings from API
  const formatDate = (dateValue: Date | string | null | undefined) => {
    if (!dateValue) return "N/A"
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Invalid date";
      return format(date, "dd MMM yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date"
    }
  }

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
      order.asal_bahan_rel?.nama?.toLowerCase().includes(query)
    );
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Press</CardTitle>
        <CardDescription>
          Orders ready for press (PRESS READY status or PRINT DONE with PRESS in product)
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
                  <TableHead className="whitespace-nowrap">Created Date</TableHead>
                  <TableHead className="sticky left-0 bg-muted/50 whitespace-nowrap">SPK</TableHead>
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
                  <TableHead className="whitespace-nowrap">Qty</TableHead>
                  <TableHead className="whitespace-nowrap">Color Matching</TableHead>
                  <TableHead className="whitespace-nowrap">Print Datetime</TableHead>
                  <TableHead className="sticky right-0 bg-muted/90 whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className="font-medium sticky left-0 bg-muted/50 whitespace-nowrap">{order.spk}</TableCell>
                    <TableCell>{order.kategori || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.customer?.nama || ""}>
                      {order.customer?.nama || ""}
                    </TableCell>
                    <TableCell className={getPriorityColorClass(order.prioritas)}>
                      {order.prioritas || ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(order.est_order)}
                    </TableCell>
                    <TableCell>{order.status || ""}</TableCell>
                    <TableCell>{order.statusprod || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.produk || ""}>
                      {order.produk || ""}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" 
                      title={order.asal_bahan_rel?.nama || order.asal_bahan_rel?.nama || ""}>
                      {order.asal_bahan_rel?.nama || order.asal_bahan_rel?.nama || ""}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.nama_kain || ""}>
                      {order.nama_kain || ""}
                    </TableCell>
                    <TableCell>{order.lebar_kain?.toString() || ""}</TableCell>
                    <TableCell>{order.qty || ""}</TableCell>
                    <TableCell className="max-w-[150px] truncate" title={order.warna_acuan || ""}>
                      {order.warna_acuan || ""}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {order.print_done 
                        ? formatDate(order.print_done)
                        : formatDate(order.tgl_print)}
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
          open={isFormOpen}
          onOpenChange={handleFormClose}
          onSuccess={handlePressSuccess}
        />
      )}
    </Card>
  );
} 