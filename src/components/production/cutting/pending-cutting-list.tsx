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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Play, MoreVertical, Search, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingCuttingOrders(currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      
      // First filter by product type - ensure it contains "CUTTING" and has no assigned operator
      const filteredByProductType = orders.filter(order => {
        const productName = (order.productName || "").toUpperCase();
        // Ensure it contains CUTTING and has no cutting ID/assignee
        return productName.includes("CUTTING") && !order.cuttingAssignee;
      });
      
      // Then apply search filter
      const filtered = filteredByProductType.filter(
        (order) =>
          order.spk.toLowerCase().includes(lowercaseQuery) ||
          order.customerName.toLowerCase().includes(lowercaseQuery) ||
          order.productName.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredOrders(filtered);
    } else {
      // Just filter by product type when no search query
      const filteredByProductType = orders.filter(order => {
        const productName = (order.productName || "").toUpperCase();
        // Ensure it contains CUTTING and has no cutting ID/assignee
        return productName.includes("CUTTING") && !order.cuttingAssignee;
      });
      setFilteredOrders(filteredByProductType);
    }
  }, [searchQuery, orders]);

  const fetchPendingCuttingOrders = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/production/orders/pending-cutting?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch pending cutting orders");
      }
      const data = await response.json();
      
      // Handle the new paginated response format
      const ordersData = data.orders || [];
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setTotalPages(data.pagination?.pages || 1);
      setTotalOrders(data.pagination?.total || 0);
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
    fetchPendingCuttingOrders(currentPage);
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
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

          {totalOrders > 0 && (
            <div className="text-sm text-muted-foreground mb-2">
              Showing {filteredOrders.length} of {totalOrders} orders (Page {currentPage} of {totalPages})
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SPK</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      No pending cutting orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.spk}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>{order.quantity} {order.unit}</TableCell>
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
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartCutting(order)}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Cutting
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
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