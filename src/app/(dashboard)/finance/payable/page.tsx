"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { 
  PlusCircle, RefreshCw, Search, FileText, Calculator, 
  Calendar, Check, Clock, AlertTriangle, X, ArrowUp, ArrowDown, Download, Filter, Plus
} from "lucide-react";
import { format, isAfter, isBefore, isToday, addDays, parseISO } from "date-fns";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { PaginationWithPages } from "@/components/ui/pagination";
import { PaymentForm } from "./components/PaymentForm";
import { CreateBillForm } from "./components/CreateBillForm";
import { FormVendorDialog } from "@/components/finance/FormVendorDialog"
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Types
export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: string;
  paidAmount: number;
  remainingAmount: number;
  totalAmount: number;
  attachmentUrl?: string;
  description?: string;
  reference?: string;
}

export interface PayableSummary {
  totalPayable: number;
  overdue: number;
  dueSoon: number;
  overdueCount: number;
  dueSoonCount: number;
  vendorCount: number;
  newVendorCount: number;
}

export interface PayableData {
  bills: Bill[];
  summary: PayableSummary;
  totalCount: number;
  pageCount: number;
  vendors?: {
    id: string;
    name: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    taxId?: string;
    notes?: string;
    createdAt: string;
  }[];
}

function AccountsPayableContent() {
  // Router and navigation
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State
  const [activeTab, setActiveTab] = useState("overview");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showBillDetail, setShowBillDetail] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PayableData | null>(null);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; code: string }>>([]);
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    vendorId: "",
    status: "",
    dateRange: {
      from: new Date(),
      to: new Date(),
    },
  });

  // Add new state for vendor list
  const [vendorList, setVendorList] = useState<PayableData['vendors']>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<NonNullable<PayableData['vendors']>[0] | null>(null);
  const [showVendorDetail, setShowVendorDetail] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);

  // Initialize state from URL params
  useEffect(() => {
    const page = searchParams.get("page");
    const search = searchParams.get("search");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const tab = searchParams.get("tab");

    if (tab && ['overview', 'all', 'unpaid', 'overdue', 'vendors'].includes(tab)) {
      setActiveTab(tab);
    }
    
    setCurrentPage(page ? parseInt(page) : 1);
    setSearchQuery(search || "");
    setFilters({
      vendorId: vendorId || "",
      status: status || "",
      dateRange: {
        from: fromDate ? new Date(fromDate) : new Date(),
        to: toDate ? new Date(toDate) : new Date(),
      },
    });
  }, [searchParams]);

  // Fetch data with current filters
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", currentPage.toString());
      queryParams.append("tab", activeTab);
      if (searchQuery) queryParams.append("search", searchQuery);
      if (filters.vendorId) queryParams.append("vendorId", filters.vendorId);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.dateRange.from) queryParams.append("fromDate", filters.dateRange.from.toISOString());
      if (filters.dateRange.to) queryParams.append("toDate", filters.dateRange.to.toISOString());

      const response = await fetch(`/api/finance/payable?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Failed to fetch payable data:", err);
      setError("Failed to load accounts payable data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors and accounts
  const fetchVendorsAndAccounts = async () => {
    try {
      const [vendorsResponse, accountsResponse] = await Promise.all([
        fetch("/api/finance/vendors"),
        fetch("/api/finance/accounts"),
      ]);

      if (!vendorsResponse.ok || !accountsResponse.ok) {
        throw new Error("Failed to fetch vendors or accounts");
      }

      const [vendorsData, accountsData] = await Promise.all([
        vendorsResponse.json(),
        accountsResponse.json(),
      ]);

      setVendors(vendorsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error fetching vendors or accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load vendors or accounts. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchData();
    fetchVendorsAndAccounts();
  }, [currentPage, activeTab]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", currentPage.toString());
    params.set("tab", activeTab);
    if (searchQuery) params.set("search", searchQuery);
    if (filters.vendorId) params.set("vendorId", filters.vendorId);
    if (filters.status) params.set("status", filters.status);
    if (filters.dateRange.from) params.set("fromDate", filters.dateRange.from.toISOString());
    if (filters.dateRange.to) params.set("toDate", filters.dateRange.to.toISOString());

    router.push(`${pathname}?${params.toString()}`);
  }, [currentPage, searchQuery, filters, activeTab, pathname, router, searchParams]);

  // Add function to fetch vendors
  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    try {
      const response = await fetch('/api/finance/vendors');
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      const data = await response.json();
      setVendorList(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Add useEffect to fetch vendors when tab changes to vendors
  useEffect(() => {
    if (activeTab === 'vendors') {
      fetchVendors();
    }
  }, [activeTab]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page on search
    fetchData();
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    setIsFilterSheetOpen(false);
    fetchData();
  };

  const clearFilters = () => {
    setFilters({
      vendorId: "",
      status: "",
      dateRange: {
        from: new Date(),
        to: new Date(),
      },
    });
    setCurrentPage(1);
    fetchData();
  };

  const handleRefresh = () => {
    fetchData();
    toast({
      title: "Data refreshed",
      description: "The latest accounts payable data has been loaded.",
    });
  };

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowBillDetail(true);
  };

  const handlePayBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsPaymentDialogOpen(true);
  };

  const handleDeleteBill = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/payable/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      toast({
        title: "Bill deleted",
        description: "The bill has been successfully deleted.",
      });
      fetchData(); // Refresh data after deletion
    } catch (err) {
      console.error("Failed to delete bill:", err);
      toast({
        title: "Error",
        description: "Failed to delete bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30"><Check className="w-3 h-3 mr-1" /> Paid</Badge>;
      case 'PARTIAL':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Partial</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 hover:bg-red-500/30"><AlertTriangle className="w-3 h-3 mr-1" /> Overdue</Badge>;
      case 'UNPAID':
        return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Unpaid</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-400 hover:bg-gray-500/30">{status}</Badge>;
    }
  };

  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
          <CardDescription>Outstanding balance</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(data?.summary?.totalPayable || 0)}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <CardDescription>Past due payments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(data?.summary?.overdue || 0)}</div>
              <div className="text-xs text-red-600">{data?.summary?.overdueCount || 0} bills overdue</div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <CardDescription>Next 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(data?.summary?.dueSoon || 0)}</div>
              <div className="text-xs text-amber-600">{data?.summary?.dueSoonCount || 0} bills due soon</div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          <CardDescription>Active suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <>
              <div className="text-2xl font-bold">{data?.summary?.vendorCount || 0}</div>
              <div className="text-xs text-muted-foreground">+{data?.summary?.newVendorCount || 0} new this month</div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Main bills table
  const BillsTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bill #</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Issue Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-red-500">
                <AlertTriangle className="w-5 h-5 mx-auto mb-2" />
                {error}
              </TableCell>
            </TableRow>
          ) : data?.bills && data.bills.length > 0 ? (
            data.bills.map((bill) => (
              <TableRow 
                key={bill.id} 
                className="group cursor-pointer hover:bg-muted/50"
              >
                <TableCell onClick={() => handleViewBill(bill)} className="font-medium">{bill.billNumber}</TableCell>
                <TableCell onClick={() => handleViewBill(bill)}>{bill.vendorName}</TableCell>
                <TableCell onClick={() => handleViewBill(bill)}>{format(new Date(bill.issueDate), 'dd MMM yyyy')}</TableCell>
                <TableCell onClick={() => handleViewBill(bill)}>
                  <div className="flex items-center">
                    {format(new Date(bill.dueDate), 'dd MMM yyyy')}
                    {isAfter(new Date(), new Date(bill.dueDate)) && bill.status !== 'PAID' && (
                      <Badge variant="outline" className="ml-2 text-red-500 border-red-200 text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell onClick={() => handleViewBill(bill)}>{formatCurrency(bill.totalAmount)}</TableCell>
                <TableCell onClick={() => handleViewBill(bill)}>{getStatusBadge(bill.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewBill(bill)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePayBill(bill)}>
                        Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteBill(bill.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No bills found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {data && data.pageCount > 1 && (
        <div className="flex items-center justify-center py-4 border-t">
          <PaginationWithPages
            currentPage={currentPage}
            totalPages={data.pageCount}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );

  // Filter sidebar
  const FilterSidebar = () => (
    <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter Bills</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your bill list
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor</label>
            <Select
              value={filters.vendorId}
              onValueChange={(value) => setFilters({...filters, vendorId: value === "ALL" ? "" : value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All vendors</SelectItem>
                {data?.vendors?.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value === "ALL" ? "" : value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <DatePickerWithRange
              date={filters.dateRange}
              setDate={(range: any) => setFilters({...filters, dateRange: range})}
            />
          </div>
        </div>
        
        <SheetFooter>
          <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          <Button onClick={applyFilters}>Apply Filters</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  // Bill detail view in a dialog
  const BillDetailView = () => (
    <Dialog open={showBillDetail} onOpenChange={setShowBillDetail}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bill #{selectedBill?.billNumber}</DialogTitle>
          <DialogDescription>
            Issued to {selectedBill?.vendorName} on {selectedBill?.issueDate ? format(new Date(selectedBill.issueDate), 'dd MMMM yyyy') : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor:</span>
                <span className="font-medium">{selectedBill?.vendorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span>{selectedBill?.issueDate ? format(new Date(selectedBill.issueDate), 'dd MMM yyyy') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span>{selectedBill?.dueDate ? format(new Date(selectedBill.dueDate), 'dd MMM yyyy') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span>{selectedBill?.reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description:</span>
                <span className="text-right max-w-[70%]">{selectedBill?.description || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{selectedBill ? formatCurrency(selectedBill.totalAmount) : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="text-green-600">{selectedBill ? formatCurrency(selectedBill.paidAmount) : ''}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-medium">Balance Due:</span>
                <span className="font-bold text-red-600">{selectedBill ? formatCurrency(selectedBill.remainingAmount) : ''}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-muted-foreground">Status:</span>
                <span>{selectedBill ? getStatusBadge(selectedBill.status) : ''}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setShowBillDetail(false)}>
            Close
          </Button>
          <Button 
            variant="default" 
            onClick={() => {
              setShowBillDetail(false);
              if (selectedBill) handlePayBill(selectedBill);
            }}
            disabled={selectedBill?.status === 'PAID'}
          >
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Add VendorList component
  const VendorList = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Tax ID</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoadingVendors ? (
            Array(5).fill(0).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : vendorList && vendorList.length > 0 ? (
            vendorList.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.name}</TableCell>
                <TableCell>{vendor.contactName}</TableCell>
                <TableCell>{vendor.email}</TableCell>
                <TableCell>{vendor.phone}</TableCell>
                <TableCell>{vendor.address}</TableCell>
                <TableCell>{vendor.taxId || '-'}</TableCell>
                <TableCell>{format(new Date(vendor.createdAt), 'dd MMM yyyy')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewVendor(vendor)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditVendor(vendor)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No vendors found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Update vendor action handlers
  const handleViewVendor = (vendor: NonNullable<PayableData['vendors']>[0]) => {
    setSelectedVendor(vendor);
    setShowVendorDetail(true);
    setIsEditingVendor(false);
  };

  const handleEditVendor = (vendor: NonNullable<PayableData['vendors']>[0]) => {
    setSelectedVendor(vendor);
    setShowVendorDetail(true);
    setIsEditingVendor(true);
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/vendors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete vendor');
      }

      toast({
        title: 'Vendor deleted',
        description: 'The vendor has been successfully deleted.',
      });
      fetchVendors(); // Refresh vendor list
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add VendorDetailDialog component
  const VendorDetailDialog = () => (
    <Dialog open={showVendorDetail} onOpenChange={setShowVendorDetail}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditingVendor ? 'Edit Vendor' : 'Vendor Details'}
          </DialogTitle>
          <DialogDescription>
            {isEditingVendor 
              ? 'Update the vendor information below.'
              : 'View the vendor details below.'}
          </DialogDescription>
        </DialogHeader>

        {selectedVendor && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                {isEditingVendor ? (
                  <Input
                    value={selectedVendor.name}
                    onChange={(e) => setSelectedVendor({...selectedVendor, name: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{selectedVendor.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                {isEditingVendor ? (
                  <Input
                    value={selectedVendor.contactName}
                    onChange={(e) => setSelectedVendor({...selectedVendor, contactName: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{selectedVendor.contactName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                {isEditingVendor ? (
                  <Input
                    type="email"
                    value={selectedVendor.email}
                    onChange={(e) => setSelectedVendor({...selectedVendor, email: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{selectedVendor.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                {isEditingVendor ? (
                  <Input
                    value={selectedVendor.phone}
                    onChange={(e) => setSelectedVendor({...selectedVendor, phone: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{selectedVendor.phone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              {isEditingVendor ? (
                <Textarea
                  value={selectedVendor.address}
                  onChange={(e) => setSelectedVendor({...selectedVendor, address: e.target.value})}
                />
              ) : (
                <p className="text-sm">{selectedVendor.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tax ID</Label>
                {isEditingVendor ? (
                  <Input
                    value={selectedVendor.taxId || ''}
                    onChange={(e) => setSelectedVendor({...selectedVendor, taxId: e.target.value})}
                  />
                ) : (
                  <p className="text-sm">{selectedVendor.taxId || '-'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Created At</Label>
                <p className="text-sm">
                  {format(new Date(selectedVendor.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
            </div>

            {isEditingVendor && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={selectedVendor.notes || ''}
                  onChange={(e) => setSelectedVendor({...selectedVendor, notes: e.target.value})}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {isEditingVendor ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingVendor(false);
                  setSelectedVendor(null);
                  setShowVendorDetail(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/finance/vendors/${selectedVendor?.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(selectedVendor),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to update vendor');
                    }

                    toast({
                      title: 'Vendor updated',
                      description: 'The vendor has been successfully updated.',
                    });
                    fetchVendors();
                    setIsEditingVendor(false);
                    setShowVendorDetail(false);
                  } catch (error) {
                    console.error('Error updating vendor:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to update vendor. Please try again.',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowVendorDetail(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => setIsEditingVendor(true)}
              >
                Edit Vendor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Accounts Payable</h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <CreateBillForm accounts={accounts} />
          <FormVendorDialog 
            trigger={
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                New Vendor
              </Button>
            }
            onVendorCreated={(newVendor) => {
              setVendors((prev) => [...prev, newVendor]);
              if (activeTab === 'vendors') {
                fetchVendors();
              }
            }}
          />
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="all">All Bills</TabsTrigger>
            <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex w-full sm:w-auto gap-2">
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <FilterSidebar />
          </div>
        </div>
        
        <TabsContent value="overview" className="space-y-6">
          <SummaryCards />
          <BillsTable />
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6">
          <BillsTable />
        </TabsContent>
        
        <TabsContent value="unpaid" className="space-y-6">
          <BillsTable />
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-6">
          <BillsTable />
        </TabsContent>
        
        <TabsContent value="vendors" className="space-y-6">
          <VendorList />
        </TabsContent>
      </Tabs>

      {/* Bill Detail Dialog */}
      {selectedBill && <BillDetailView />}
      
      {/* Payment Form */}
      <PaymentForm
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        bill={selectedBill}
        onSuccess={fetchData}
      />
      
      {/* Add VendorDetailDialog */}
      <VendorDetailDialog />
    </PageContainer>
  );
}

export default function AccountsPayablePage() {
  return (
    <Suspense fallback={
      <PageContainer>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Accounts Payable</h1>
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </PageContainer>
    }>
      <AccountsPayableContent />
    </Suspense>
  );
} 