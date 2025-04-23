"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, Search, FileText, ArrowUpDown, 
  Loader2, AlertCircle, Calendar, DollarSign, Plus, ArrowDown, ArrowUp, Users 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isAfter, isBefore, isToday, addDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { usePathname } from "next/navigation";
import { PayableFilter, FilterValues } from './components/PayableFilter';
import { PayableTable } from './components/PayableTable';
import { BillFormDialog } from "./components/BillFormDialog";
import { PaymentDialog } from "./components/PaymentDialog";
import { formatCurrency } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { PayableSummaryCards } from "./components/PayableSummaryCards";

// Types
type Bill = {
  id: string;
  billNumber: string;
  description: string;
  vendorId: string;
  vendorName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: "draft" | "open" | "paid" | "partial" | "cancelled" | "overdue";
};

type BillsResponse = {
  bills: Bill[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    totalDue: number;
    totalOverdue: number;
    dueSoon: number;
  };
};

// Status badge component
const StatusBadge = ({ status }: { status: Bill["status"] }) => {
  const statusConfig = {
    draft: { label: "Draft", variant: "outline" as const },
    open: { label: "Open", variant: "secondary" as const },
    paid: { label: "Paid", variant: "success" as const },
    partial: { label: "Partial", variant: "warning" as const },
    cancelled: { label: "Cancelled", variant: "destructive" as const },
    overdue: { label: "Overdue", variant: "destructive" as const },
  };

  const config = statusConfig[status] || { label: status, variant: "outline" as const };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

export interface PayableSummary {
  totalPayable: number;
  totalOverdue: number;
  overdueCount: number;
  totalDueSoon: number;
  dueSoonCount: number;
  vendorCount: number;
  newVendorCount: number;
  percentChange: number;
}

export default function AccountsPayablePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [vendorFilter, setVendorFilter] = useState("");
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState({
    total: 0,
    overdue: 0,
    dueSoon: 0,
  });
  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    vendorId: '',
    dueDateStart: undefined,
    dueDateEnd: undefined,
  });
  const [openBillForm, setOpenBillForm] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [summaryData, setSummaryData] = useState<PayableSummary>({
    totalPayable: 0,
    totalOverdue: 0,
    overdueCount: 0,
    totalDueSoon: 0,
    dueSoonCount: 0,
    vendorCount: 0,
    newVendorCount: 0,
    percentChange: 0
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Load vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch("/api/vendors");
        if (!response.ok) {
          throw new Error("Failed to fetch vendors");
        }
        const data = await response.json();
        setVendors(data.vendors || []);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        toast({
          title: "Error",
          description: "Failed to load vendors",
          variant: "destructive",
        });
      }
    };

    fetchVendors();
  }, [toast]);

  // Load bills with filters
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        
        if (search) params.append("search", search);
        if (vendorFilter) params.append("vendorId", vendorFilter);
        if (startDate) params.append("dueDateStart", startDate.toISOString());
        if (endDate) params.append("dueDateEnd", endDate.toISOString());
        
        // Set status filter based on active tab or explicit status filter
        let statusParam = statusFilter;
        if (activeTab === "open") statusParam = "open";
        if (activeTab === "overdue") statusParam = "overdue";
        if (activeTab === "paid") statusParam = "paid";
        if (statusParam) params.append("status", statusParam);
        
        params.append("page", currentPage.toString());
        params.append("pageSize", pageSize.toString());

        // Fetch bills
        const response = await fetch(`/api/finance/payable?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch bills");
        }
        
        const data: BillsResponse = await response.json();
        setBills(data.bills || []);
        setTotalPages(data.pagination.totalPages);
        setTotalItems(data.pagination.totalItems);
        setSummary(data.summary);
      } catch (error) {
        console.error("Error fetching bills:", error);
        toast({
          title: "Error",
          description: "Failed to load bills",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [
    search, 
    vendorFilter, 
    startDate, 
    endDate, 
    statusFilter, 
    activeTab, 
    currentPage, 
    pageSize,
    toast
  ]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, vendorFilter, startDate, endDate, statusFilter, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setStatusFilter(""); // Reset explicit status filter when changing tabs
    
    // Update filters based on tab selection
    const newFilters = {...filters};
    
    // Reset date filters when changing tabs
    newFilters.dueDateStart = undefined;
    newFilters.dueDateEnd = undefined;
    
    if (value === 'overdue') {
      const today = new Date();
      newFilters.dueDateEnd = today;
    } else if (value === 'upcoming') {
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      newFilters.dueDateStart = today;
      newFilters.dueDateEnd = nextWeek;
    }
    
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setVendorFilter("");
    setStartDate(undefined);
    setEndDate(undefined);
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Generate pagination links
  const generatePaginationLinks = () => {
    const links = [];
    const maxDisplayed = 5;
    const halfMaxDisplayed = Math.floor(maxDisplayed / 2);
    
    let startPage = Math.max(1, currentPage - halfMaxDisplayed);
    let endPage = Math.min(totalPages, startPage + maxDisplayed - 1);
    
    if (endPage - startPage + 1 < maxDisplayed) {
      startPage = Math.max(1, endPage - maxDisplayed + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === currentPage}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return links;
  };

  const handleCreateBill = async (formData: any) => {
    try {
      const response = await fetch("/api/finance/payable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bill");
      }
      
      toast({
        title: "Success",
        description: "Bill created successfully",
      });
      setIsCreateDialogOpen(false);
      fetchSummaryData();
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bill",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  useEffect(() => {
    fetchSummaryData();
  }, [refreshTrigger]);

  const fetchSummaryData = async () => {
    try {
      const response = await fetch("/api/finance/payable?page=1&pageSize=1");
      if (!response.ok) throw new Error("Failed to fetch summary data");
      
      const data = await response.json();
      setSummaryData({
        totalPayable: data.summary.totalOutstanding,
        totalOverdue: data.summary.totalOverdue,
        overdueCount: data.summary.overdueCount,
        totalDueSoon: data.summary.totalDueSoon,
        dueSoonCount: data.summary.dueSoonCount,
        vendorCount: data.summary.vendorCount || 0,
        newVendorCount: data.summary.newVendorCount || 0,
        percentChange: data.summary.percentChange || 0
      });
    } catch (error) {
      console.error("Error fetching summary data:", error);
      toast({
        title: "Error",
        description: "Failed to load summary data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBillFormSubmit = async (data, billId = null) => {
    if (billId) {
      return handleUpdateBill(data, billId);
    } else {
      return handleCreateBill(data);
    }
  };

  const handleEditBill = (bill) => {
    setSelectedBill(bill);
    setOpenBillForm(true);
  };

  const handleRecordPayment = (bill) => {
    setSelectedBill(bill);
    setOpenPaymentDialog(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <PageContainer>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Accounts Payable</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            Create Bill
          </button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all">All Bills</TabsTrigger>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : formatCurrency(summaryData.totalPayable)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {summaryData.percentChange > 0 ? (
                    <>
                      <ArrowUp className="mr-1 h-4 w-4 text-rose-500" />
                      <span className="text-rose-500">+{summaryData.percentChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown className="mr-1 h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-500">{Math.abs(summaryData.percentChange).toFixed(1)}%</span>
                    </>
                  )}
                  <span className="ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : formatCurrency(summaryData.totalOverdue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "" : `${summaryData.overdueCount} ${summaryData.overdueCount === 1 ? 'invoice' : 'invoices'}`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : formatCurrency(summaryData.totalDueSoon)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "" : `${summaryData.dueSoonCount} ${summaryData.dueSoonCount === 1 ? 'invoice' : 'invoices'}`}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "Loading..." : summaryData.vendorCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loading ? "" : `${summaryData.newVendorCount} new this month`}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-1">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Payables</CardTitle>
                <CardDescription>Recent bills and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <PayableTable 
                  initialTab="overview"
                  onRefreshData={fetchSummaryData}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4">
          <PayableFilter />
          <PayableTable 
            initialTab="all"
            onRefreshData={fetchSummaryData}
          />
        </TabsContent>
        
        <TabsContent value="unpaid" className="space-y-4">
          <PayableFilter />
          <PayableTable 
            initialTab="unpaid"
            onRefreshData={fetchSummaryData}
          />
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          <PayableFilter />
          <PayableTable 
            initialTab="overdue"
            onRefreshData={fetchSummaryData}
          />
        </TabsContent>
      </Tabs>
      
      <BillFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSubmit={handleCreateBill}
      />
    </PageContainer>
  );
}