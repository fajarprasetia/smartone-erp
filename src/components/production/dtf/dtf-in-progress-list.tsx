"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, RefreshCw, Search, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DTFCompleteForm from "./dtf-complete-form";

interface Order {
  id: string;
  spk: string;
  customer: { nama: string };
  produk: string;
  status: string;
  prioritas: string;
  created_at: string;
  est_order: string | null;
  tgl_dtf: string;
}

interface DTFInProgressListProps {
  onOrderComplete?: () => void;
}

export default function DTFInProgressList({ onOrderComplete }: DTFInProgressListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  // Fetch orders on component mount
  useEffect(() => {
    fetchDTFInProgressOrders();
  }, []);

  // Filter orders based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order.spk.toLowerCase().includes(query) ||
          order.customer.nama.toLowerCase().includes(query) ||
          order.produk.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  // Fetch DTF in progress orders from API
  const fetchDTFInProgressOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/dtf-in-progress");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error("Failed to fetch DTF in progress orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Complete DTF order
  const handleCompleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setCompleteDialogOpen(true);
  };

  // Format date display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy HH:mm");
  };

    return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">DTF In Progress</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDTFInProgressOrders}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <Search className="h-4 w-4 mr-2 opacity-50" />
          <Input
            placeholder="Search by SPK, customer, or product..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SPK</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No DTF in progress orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.spk}</TableCell>
                    <TableCell>{order.customer.nama}</TableCell>
                    <TableCell>{order.produk}</TableCell>
                    <TableCell>{order.prioritas}</TableCell>
                    <TableCell>{formatDate(order.tgl_dtf)}</TableCell>
                    <TableCell>
                      {order.est_order ? formatDate(order.est_order) : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions <ChevronDown className="ml-1 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCompleteOrder(order)}
                          >
                            Complete DTF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Complete DTF Process</DialogTitle>
          <DialogDescription>
            Fill in the details to complete the DTF process for this order.
          </DialogDescription>
          {selectedOrder && (
            <DTFCompleteForm
              order={{
                id: selectedOrder.id,
                spk: selectedOrder.spk,
                customer: { nama: selectedOrder.customer.nama },
                produk: selectedOrder.produk
              }}
              onSuccess={() => {
                setCompleteDialogOpen(false);
                fetchDTFInProgressOrders();
                if (onOrderComplete) onOrderComplete();
              }}
              onCancel={() => setCompleteDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 