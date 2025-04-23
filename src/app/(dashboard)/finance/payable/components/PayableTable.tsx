"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  MoreHorizontal,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PayableFilter } from "./PayableFilter";
import { BillFormDialog } from "./BillFormDialog";
import { PaymentDialog } from "./PaymentDialog";

// Types
export interface BillItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  accountId: number;
  taxRate: number;
}

export interface Bill {
  id: number;
  vendorId: number;
  vendorName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "pending" | "paid" | "partial" | "overdue";
  reference?: string;
  notes?: string;
  items?: BillItem[];
  attachments?: {
    id: number;
    fileName: string;
    fileUrl: string;
  }[];
}

interface BillsResponse {
  bills: Bill[];
  pageCount: number;
  totalAmount: number;
  overdueAmount: number;
  pendingAmount: number;
  dueSoonAmount: number;
  overdueCount: number;
  dueSoonCount: number;
  vendorCount: number;
}

export function PayableTable() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalAmount, setTotalAmount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [dueSoonAmount, setDueSoonAmount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [dueSoonCount, setDueSoonCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);

  // Dialog states
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Filter states
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dueDateStart, setDueDateStart] = useState<Date | null>(null);
  const [dueDateEnd, setDueDateEnd] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Parse URL parameters on component mount
  useEffect(() => {
    const page = searchParams.get("page") 
      ? parseInt(searchParams.get("page") as string) 
      : 1;
    const size = searchParams.get("pageSize") 
      ? parseInt(searchParams.get("pageSize") as string) 
      : 10;
    const vendor = searchParams.get("vendorId") 
      ? parseInt(searchParams.get("vendorId") as string) 
      : null;
    const statusParam = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const start = searchParams.get("dueDateStart") 
      ? parseISO(searchParams.get("dueDateStart") as string) 
      : null;
    const end = searchParams.get("dueDateEnd") 
      ? parseISO(searchParams.get("dueDateEnd") as string) 
      : null;

    setCurrentPage(page);
    setPageSize(size);
    setVendorId(vendor);
    setStatus(statusParam);
    setSearchQuery(search);
    setDueDateStart(start);
    setDueDateEnd(end);
    
    // Initial fetch will happen via useEffect dependency
  }, [searchParams]);

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    params.append("page", currentPage.toString());
    params.append("pageSize", pageSize.toString());
    
    if (vendorId) params.append("vendorId", vendorId.toString());
    if (status) params.append("status", status);
    if (searchQuery) params.append("search", searchQuery);
    if (dueDateStart) params.append("dueDateStart", format(dueDateStart, "yyyy-MM-dd"));
    if (dueDateEnd) params.append("dueDateEnd", format(dueDateEnd, "yyyy-MM-dd"));
    
    return params.toString();
  }, [currentPage, pageSize, vendorId, status, searchQuery, dueDateStart, dueDateEnd]);

  // Update URL with current filters
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    params.append("page", currentPage.toString());
    params.append("pageSize", pageSize.toString());
    
    if (vendorId) params.append("vendorId", vendorId.toString());
    if (status) params.append("status", status);
    if (searchQuery) params.append("search", searchQuery);
    if (dueDateStart) params.append("dueDateStart", format(dueDateStart, "yyyy-MM-dd"));
    if (dueDateEnd) params.append("dueDateEnd", format(dueDateEnd, "yyyy-MM-dd"));
    
    router.push(`?${params.toString()}`);
  }, [router, currentPage, pageSize, vendorId, status, searchQuery, dueDateStart, dueDateEnd]);

  // Fetch bills data
  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/finance/payable?${queryParams}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch bills");
      }
      
      const data: BillsResponse = await response.json();
      
      setBills(data.bills);
      setPageCount(data.pageCount);
      setTotalAmount(data.totalAmount);
      setOverdueAmount(data.overdueAmount);
      setPendingAmount(data.pendingAmount);
      setDueSoonAmount(data.dueSoonAmount);
      setOverdueCount(data.overdueCount);
      setDueSoonCount(data.dueSoonCount);
      setVendorCount(data.vendorCount);
    } catch (error) {
      console.error("Error fetching bills:", error);
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams]);

  // Fetch bills when dependencies change
  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrl();
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
    updateUrl();
  };

  // Handle filter changes
  const handleFilterChange = (
    vendor: number | null,
    statusFilter: string | null,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setVendorId(vendor);
    setStatus(statusFilter);
    setDueDateStart(startDate);
    setDueDateEnd(endDate);
    setCurrentPage(1); // Reset to first page
    updateUrl();
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page
    updateUrl();
  };

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
      draft: { label: "Draft", variant: "outline" },
      pending: { label: "Pending", variant: "secondary" },
      partial: { label: "Partial", variant: "secondary" },
      paid: { label: "Paid", variant: "success" },
      overdue: { label: "Overdue", variant: "destructive" },
    };

    const { label, variant } = statusMap[status] || { label: status, variant: "default" };

    return (
      <Badge variant={variant} className="capitalize">
        {label}
      </Badge>
    );
  };

  // Open bill form dialog
  const handleCreateBill = () => {
    setSelectedBill(null);
    setBillFormOpen(true);
  };

  // Open bill form dialog for edit
  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setBillFormOpen(true);
  };

  // Open payment dialog
  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentDialogOpen(true);
  };

  // View bill details
  const handleViewBill = (billId: number) => {
    router.push(`/finance/payable/${billId}`);
  };

  // Delete bill
  const handleDeleteBill = async (billId: number) => {
    if (!confirm("Are you sure you want to delete this bill?")) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/payable/${billId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete bill");
      }

      // Refresh the bills list
      fetchBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("Failed to delete bill. Please try again.");
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (pageCount <= 1) return null;

    const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
    const displayPages = pages.filter(
      (page) => page === 1 || page === pageCount || Math.abs(page - currentPage) <= 1
    );

    let finalPages: (number | string)[] = [];
    let lastValue: number | string = 0;

    displayPages.forEach((page) => {
      if (lastValue && page - (lastValue as number) > 1) {
        finalPages.push("...");
      }
      finalPages.push(page);
      lastValue = page;
    });

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="h-8 w-16 rounded-md border border-input bg-background"
          >
            {[10, 25, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {finalPages.map((page, i) => (
            typeof page === "number" ? (
              <Button
                key={i}
                variant={page === currentPage ? "default" : "outline"}
                size="icon"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ) : (
              <span key={i} className="px-2">
                {page}
              </span>
            )
          ))}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(pageCount)}
            disabled={currentPage === pageCount}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Bills & Payments</h2>
        <Button onClick={handleCreateBill}>
          <Plus className="mr-2 h-4 w-4" /> New Bill
        </Button>
      </div>

      <PayableFilter
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        initialVendorId={vendorId}
        initialStatus={status}
        initialDueDateStart={dueDateStart}
        initialDueDateEnd={dueDateEnd}
        initialSearchQuery={searchQuery}
      />

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No bills found. Create a new bill to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell className="font-medium">
                            {bill.vendorName}
                          </TableCell>
                          <TableCell>{bill.billNumber || "-"}</TableCell>
                          <TableCell>
                            {bill.billDate ? format(new Date(bill.billDate), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell>
                            {bill.dueDate ? format(new Date(bill.dueDate), "MMM d, yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(bill.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(bill.totalAmount - bill.paidAmount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(bill.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewBill(bill.id)}>
                                  <FileText className="mr-2 h-4 w-4" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditBill(bill)}>
                                  Edit
                                </DropdownMenuItem>
                                {bill.status !== "paid" && (
                                  <DropdownMenuItem onClick={() => handlePayBill(bill)}>
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                                {bill.status === "draft" && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteBill(bill.id)}
                                    className="text-destructive"
                                  >
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">{renderPagination()}</div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BillFormDialog
        open={billFormOpen}
        onOpenChange={setBillFormOpen}
        bill={selectedBill || undefined}
        onSuccess={fetchBills}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        bill={selectedBill}
        onSuccess={fetchBills}
      />
    </div>
  );
}