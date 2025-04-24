"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Play, Search, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Order } from "@/types/order";
import { CuttingStartForm } from "./cutting-start-form";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";

interface PendingCuttingListProps {
  onCuttingStart: () => void;
}

export default function PendingCuttingList({ onCuttingStart }: PendingCuttingListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isStartFormOpen, setIsStartFormOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCuttingOrders();
  }, []);

  useEffect(() => {
    console.log(`Total orders received from API: ${orders.length}`);

    // Log orders with CUTTING READY status to debug
    const cuttingReadyOrders = orders.filter(order => 
      (order.status || "").toUpperCase() === "CUTTING READY"
    );
    console.log(`Orders with CUTTING READY status: ${cuttingReadyOrders.length}`);
    if (cuttingReadyOrders.length > 0) {
      console.log("Sample CUTTING READY order:", cuttingReadyOrders[0]);
    }

    // Filter orders by these exact criteria:
    // 1. Orders with status "CUTTING READY" 
    // 2. Orders with status "PRESS DONE" that have "CUTTING" in their product name
    const filteredByCriteria = orders.filter(order => {
      const status = ((order.status || "").trim()).toUpperCase();
      const productName = (order.productName || "").toUpperCase();
      
      const isMatch = (
        // Condition 1: Status is "CUTTING READY" (handle possible variations)
        status === "CUTTING READY" || status === "CUTTINGREADY" || 
        // Condition 2: Status is "PRESS DONE" and product contains "CUTTING"
        (status === "PRESS DONE" && productName.includes("CUTTING"))
      );

      // Debug log for orders that don't match our criteria
      if (status.includes("CUTTING") && status.includes("READY") && !isMatch) {
        console.log("Potential CUTTING READY order not matching criteria:", {
          status: order.status,
          trimmedUpperStatus: status,
          order
        });
      }
      
      return isMatch;
    });
    
    console.log(`Orders after criteria filtering: ${filteredByCriteria.length}`);
    
    // Then apply search filter if there's a search query
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = filteredByCriteria.filter(
        (order) =>
          order.spk.toLowerCase().includes(lowercaseQuery) ||
          (order.customerName || "").toLowerCase().includes(lowercaseQuery) ||
          (order.productName || "").toLowerCase().includes(lowercaseQuery)
      );
      setFilteredOrders(filtered);
      console.log(`Orders after search filtering: ${filtered.length}`);
    } else {
      // If no search query, use the criteria-filtered orders
      setFilteredOrders(filteredByCriteria);
    }
  }, [searchQuery, orders]);

  const fetchPendingCuttingOrders = async () => {
    setLoading(true);
    try {
      // Remove pagination parameters to get all orders
      const response = await fetch(`/api/production/orders/pending-cutting?limit=1000`);
      if (!response.ok) {
        throw new Error("Failed to fetch pending cutting orders");
      }
      const data = await response.json();
      
      // Handle the response format
      const ordersData = data.orders || [];
      
      // Check for specific example order
      const exampleOrderId = "cm9us26do00013ipolpx7vqeg";
      const exampleOrderFound = ordersData.some((order: Order) => order.id === exampleOrderId);
      console.log(`Example order with ID ${exampleOrderId} found in API response: ${exampleOrderFound}`);
      
      // Log full data if important orders aren't appearing
      if (!exampleOrderFound) {
        console.log("First 5 orders from API response:", ordersData.slice(0, 5));
      }
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      console.log(`Total orders loaded: ${ordersData.length}`);
    } catch (error) {
      console.error("Error fetching pending cutting orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending cutting orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCutting = (order: Order) => {
    setSelectedOrder(order);
    setIsStartFormOpen(true);
  };

  const handleRefresh = () => {
    fetchPendingCuttingOrders();
  };

  const getPriorityClass = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Cutting Orders</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by SPK, customer, or product..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {orders.length > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              Showing {filteredOrders.length} of {orders.length} orders
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-muted/50 whitespace-nowrap">SPK</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead className="sticky right-0 bg-muted/90 whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      No pending cutting orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium sticky left-0 bg-muted/50 whitespace-nowrap">{order.spk}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.quantity} {order.unit}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                          {order.status || "CUTTING READY"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={getPriorityClass(order.priority)}
                        >
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{order.targetCompletionDate ? formatDate(order.targetCompletionDate) : "-"}</TableCell>
                      <TableCell className="sticky right-0 bg-muted/90 whitespace-nowrap">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => handleStartCutting(order)}
                        >
                          <Play className="h-4 w-4" />
                          Start
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for starting cutting process */}
      <Dialog open={isStartFormOpen} onOpenChange={setIsStartFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogTitle>Start Cutting Process</DialogTitle>
          <DialogDescription>
            {selectedOrder && `Order: ${selectedOrder.spk} - ${selectedOrder.customerName}`}
          </DialogDescription>
          <CuttingStartForm
            order={selectedOrder}
            open={isStartFormOpen}
            onOpenChange={setIsStartFormOpen}
            onSuccess={onCuttingStart}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 