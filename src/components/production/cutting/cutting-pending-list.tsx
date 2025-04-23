"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CuttingStartForm } from "./cutting-start-form";
import { RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Order as OrderType } from "@/types/order";

interface Order {
  id: string;
  spk: string;
  customerName: string;
  customerId: string;
  productName: string;
  quantity: number;
  unit: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  productionType: {
    PRINT: boolean;
    PRESS: boolean;
    CUTTING: boolean;
    DTF: boolean;
    SEWING: boolean;
  };
}

interface CuttingPendingListProps {
  refreshTrigger: boolean;
  onCuttingStart: () => void;
}

export function CuttingPendingList({ refreshTrigger, onCuttingStart }: CuttingPendingListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCuttingStartOpen, setIsCuttingStartOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders?status=PRESS%20DONE");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      // Map API response to match our Order interface
      const formattedData = data.map((order: any) => ({
        id: order.id,
        spk: order.spk,
        customerName: order.customer_name,
        customerId: order.customer_id || "",
        productName: order.product_name,
        quantity: order.quantity,
        unit: order.unit || "pcs",
        priority: order.priority,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        status: order.status,
        productionType: order.production_type || {
          PRINT: false,
          PRESS: false,
          CUTTING: false,
          DTF: false,
          SEWING: false
        }
      }));
      setOrders(formattedData);
      setFilteredOrders(formattedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load pending cutting orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter((order) =>
        order.spk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500 hover:bg-red-600";
      case "medium":
        return "bg-amber-500 hover:bg-amber-600";
      case "low":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-blue-500 hover:bg-blue-600";
    }
  };

  const handleStartCutting = (order: Order) => {
    setSelectedOrder(order);
    setIsCuttingStartOpen(true);
  };

  const handleCuttingStartClose = () => {
    setIsCuttingStartOpen(false);
    setSelectedOrder(null);
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <div className="space-y-4 p-4 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by SPK, customer, or product..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SPK</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No pending cutting orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.spk}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.productName}</TableCell>
                  <TableCell>{order.quantity} {order.unit}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityClass(order.priority)}>
                      {order.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleStartCutting(order)}
                    >
                      Start Cutting
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedOrder && (
        <CuttingStartForm
          order={selectedOrder}
          open={isCuttingStartOpen}
          onOpenChange={handleCuttingStartClose}
          onSuccess={onCuttingStart}
        />
      )}
    </div>
  );
} 