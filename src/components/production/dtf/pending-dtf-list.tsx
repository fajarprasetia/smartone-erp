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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, RefreshCw, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import DTFStartForm from "./dtf-start-form";

interface Order {
  id: string;
  spk: string;
  customer: {
    name: string;
  };
  produk: string;
  status: string;
  prioritas: number;
  created_at: string;
  est_order: string;
  tgl_dtf: string;
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
        order.spk.toLowerCase().includes(query) ||
        order.customer.name.toLowerCase().includes(query) ||
        order.produk.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Fetch pending DTF orders from API
  async function fetchPendingDTFOrders() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/pending-dtf");
      
      if (!response.ok) {
        throw new Error("Failed to fetch pending DTF orders");
      }
      
      const data = await response.json();
      
      // Map the API response to correctly format customer data
      const mappedData = data.map((order: any) => ({
        ...order,
        customer: {
          name: order.customer?.nama || "N/A"
        },
        product: {
          name: order.produk
        }
      }));
      
      setOrders(mappedData);
      setFilteredOrders(mappedData);
    } catch (error) {
      console.error("Error fetching pending DTF orders:", error);
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
  function getPriorityColorClass(priority: number) {
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
  function formatDate(dateString: string) {
    if (!dateString) return "N/A";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pending DTF</CardTitle>
          <CardDescription>Orders ready for DTF processing</CardDescription>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>SPK</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {isLoading
                    ? "Loading pending DTF orders..."
                    : "No pending DTF orders found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {order.created_at ? formatDate(order.created_at) : "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">{order.spk}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>{order.produk}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColorClass(order.prioritas)}>
                      {order.prioritas}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.est_order ? formatDate(order.est_order) : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStartDTF(order)}>
                          Start DTF Process
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              onSuccess={() => {
                setStartDTFDialogOpen(false);
                fetchPendingDTFOrders();
                if (onOrderProcessed) onOrderProcessed();
                toast.success("DTF process started successfully");
              }}
              onCancel={() => setStartDTFDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
} 