"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Search,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Receipt,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { debounce } from "lodash"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { PaymentReceipt } from "@/components/finance/PaymentReceipt"

interface Invoice {
  id: string | null
  invoiceNumber: string | null
  invoice: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  status: string | null
  customer?: {
    id: string | number
    nama: string;
    phone: string | null;
  } | null;
  order?: {
    id: string | number
    spk: string | null
    produk: string | null;
    invoice: string | null;
  } | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes: string | null;
  transactions: {
    id: string;
    amount: number;
    date: Date;
    paymentMethod: string | null;
    status: string;
    receiptUrl?: string | null;
  }[];
}

interface InvoiceData {
  invoices: Invoice[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  },
  summary: {
    totalReceivables: number;
    overdue: {
      count: number;
      amount: number;
    };
    dueSoon: {
      count: number;
      amount: number;
    };
    paid: {
      count: number;
      amount: number;
    };
  }
}

interface SortOption {
  field: string;
  order: "asc" | "desc";
}

function PaymentForm({ 
  invoice, 
  onClose, 
  onSuccess 
}: { 
  invoice: Invoice | null, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>("TF");
  const [notes, setNotes] = useState<string>("");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (invoice) {
      setPaymentAmount(invoice.balance.toString());
    }
  }, [invoice]);
  
  const generateInvoiceNumber = async () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const prefix = `SO01${month}${year}`;
    
    try {
      const response = await fetch(`/api/orders/latest-invoice?prefix=${prefix}`);
      if (!response.ok) throw new Error("Failed to get latest invoice number");
      
      const data = await response.json();
      let nextNumber = 1;
      
      if (data.latestInvoice) {
        const sequenceStr = data.latestInvoice.substring(prefix.length);
        const sequence = parseInt(sequenceStr, 10);
        if (!isNaN(sequence)) {
          nextNumber = sequence + 1;
        }
      }
      
      const formattedNumber = String(nextNumber).padStart(6, '0');
      return `${prefix}${formattedNumber}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
      return `${prefix}${Date.now().toString().slice(-6)}`;
    }
  };
  
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invoice) return;
    
    try {
      setIsLoading(true);
      
      let invoiceNumber = invoice.invoiceNumber;
      if (!invoiceNumber || invoiceNumber.startsWith('INV-')) {
        invoiceNumber = await generateInvoiceNumber();
        
        // Update the order status to indicate it has been invoiced
        try {
          const updateOrderResponse = await fetch(`/api/orders/${invoice.order?.id}/update-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              keterangan: "SUDAH DIINVOICEKAN"
            }),
          });
          
          if (!updateOrderResponse.ok) {
            console.warn('Failed to update order status, but continuing with payment processing');
          }
        } catch (error) {
          console.warn('Error updating order status:', error);
          // Continue with payment processing even if updating the status fails
        }
      }
      
      let receiptPath = null;
      if (paymentFile) {
        const formData = new FormData();
        formData.append('file', paymentFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload receipt');
        }
        
        const uploadResult = await uploadResponse.json();
        receiptPath = uploadResult.path;
      }
      
      const paymentData = {
        orderId: invoice.id,
        amount: parseFloat(paymentAmount),
        paymentDate: paymentDate.toISOString(),
        paymentMethod,
        notes,
        receiptPath,
        invoiceNumber
      };
      
      const response = await fetch('/api/finance/receivable/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record payment');
      }
      
      toast.success('Payment recorded successfully');
      onSuccess();
      
      setPaymentAmount("");
      setPaymentDate(new Date());
      setPaymentMethod("TF");
      setNotes("");
      setPaymentFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentFile(e.target.files[0]);
    }
  };
  
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };
  
  if (!invoice) return null;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-muted/20 p-3 rounded-md mb-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Invoice #{invoice.invoiceNumber || 'New'}</h3>
          <Badge>{invoice.status}</Badge>
        </div>
        <div className="text-sm grid gap-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer:</span> 
            <span className="font-medium">{invoice.customer?.nama || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date:</span> 
            <span className="font-medium">{formatDate(invoice.dueDate)}</span>
          </div>
          {invoice.order?.spk && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">SPK:</span> 
              <span className="font-medium">{invoice.order.spk}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Total Amount</label>
            <p className="font-medium">{formatCurrency(invoice.total)}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Balance Due</label>
            <p className="font-medium">{formatCurrency(invoice.balance)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="paymentAmount" className="text-sm font-medium">Payment Amount</label>
          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            required
            className="bg-background/50"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="paymentDate" className="text-sm font-medium">Payment Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full pl-3 text-left font-normal bg-background/50",
                  !paymentDate && "text-muted-foreground"
                )}
              >
                {paymentDate ? (
                  format(paymentDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={paymentDate}
                onSelect={(date) => date && setPaymentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="paymentMethod" className="bg-background/50">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TF">Bank Transfer</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="DEBIT">Debit Card</SelectItem>
              <SelectItem value="CREDIT">Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="paymentReceipt" className="text-sm font-medium">Payment Receipt</label>
          <Input
            id="paymentReceipt"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground">Upload a receipt or proof of payment (optional)</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Notes</label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any payment notes or reference numbers"
            className="resize-none bg-background/50"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Processing..." : "Confirm Payment"}
        </Button>
      </div>
    </form>
  );
}

export default function AccountsReceivablePage() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<string>("invoiceDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [activeTab, setActiveTab] = useState("invoices");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [transactions, setTransactions] = useState<{
    id: string;
    amount: number;
    date: Date;
    paymentMethod: string | null;
    status: string;
    receiptUrl?: string | null;
    invoiceNumber?: string | null;
    customerName?: string | null;
    order?: {
      id: string | number;
      spk: string | null;
      invoice: string | null;
    } | null;
  }[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalTransactionPages, setTotalTransactionPages] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const debouncedSearch = useMemo(() => debounce(() => {
    setPage(1);
    fetchInvoices();
  }, 500), [search]);

  const debouncedTransactionSearch = useMemo(() => debounce(() => {
    setPaymentsPage(1);
    fetchTransactions();
  }, 500), [transactionSearch]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      debouncedTransactionSearch.cancel();
    };
  }, [debouncedSearch, debouncedTransactionSearch]);

  useEffect(() => {
    if (search !== "") {
      debouncedSearch();
    }
  }, [search, debouncedSearch]);

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize, statusFilter, sortBy, sortOrder]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder })
      });
      
      const response = await fetch(`/api/finance/receivable?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching invoice data: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch invoice data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setSelectedInvoice(null);
    fetchInvoices();
    toast.success("Payment recorded successfully");
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return format(date, 'dd MMM yyyy');
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'UNPAID':
        return <Badge variant="secondary">Unpaid</Badge>;
      case 'PARTIALLY_PAID':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Partially Paid</Badge>;
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortOrder === "asc" ? 
      <ChevronUp className="ml-2 h-4 w-4" /> : 
      <ChevronDown className="ml-2 h-4 w-4" />;
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const SortableTableHead = ({ 
    children, 
    field 
  }: { 
    children: React.ReactNode, 
    field: string 
  }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon(field)}
      </div>
    </TableHead>
  );

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const queryParams = new URLSearchParams({
        page: paymentsPage.toString(),
        pageSize: paymentsPageSize.toString(),
        ...(transactionSearch && { search: transactionSearch }),
        includeOrderDetails: "true"
      });
      
      const response = await fetch(`/api/finance/receivable/payment?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching payment history: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Payment transactions data:", result.transactions);
      
      // Enhance transactions with order data if missing
      const processedTransactions = await Promise.all((result.transactions || []).map(async (transaction) => {
        // If transaction already has order data with SPK, use it
        if (transaction.order?.spk) {
          return transaction;
        }
        
        // If transaction has orderId but no complete order data, fetch it
        if (transaction.orderId) {
          try {
            const orderResponse = await fetch(`/api/orders/${transaction.orderId}`);
            if (orderResponse.ok) {
              const orderData = await orderResponse.json();
              return {
                ...transaction,
                order: orderData
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch order for transaction ${transaction.id}`, error);
          }
        }
        
        return transaction;
      }));
      
      setTransactions(processedTransactions);
      setTotalTransactions(result.pagination?.totalCount || 0);
      setTotalTransactionPages(result.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch payment history:", err);
      toast.error("Failed to load payment history");
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      fetchTransactions();
    }
  }, [activeTab, paymentsPage, paymentsPageSize]);

  const handlePaymentsPageChange = (newPage: number) => {
    setPaymentsPage(newPage);
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return 'Unknown';
    
    switch (method) {
      case 'TF':
        return 'Bank Transfer';
      case 'CASH':
        return 'Cash';
      case 'DEBIT':
        return 'Debit Card';
      case 'CREDIT':
        return 'Credit Card';
      default:
        return method;
    }
  };

  const handleTransactionSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionSearch(e.target.value);
  };

  useEffect(() => {
    if (transactionSearch !== "") {
      debouncedTransactionSearch();
    }
  }, [transactionSearch, debouncedTransactionSearch]);

  useEffect(() => {
    if (showInvoiceDetails) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showInvoiceDetails]);

  useEffect(() => {
    if (showPaymentForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPaymentForm]);

  const handleViewReceipt = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowReceipt(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Accounts Receivable</h1>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Receivables</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.summary.totalReceivables || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.pagination.totalCount || 0} open invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.summary.overdue.amount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.summary.overdue.count || 0} invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.summary.dueSoon.amount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.summary.dueSoon.count || 0} invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(data?.summary.paid.amount || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.summary.paid.count || 0} invoices
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Customer Invoices</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-8"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => fetchInvoices()}>
                  <Search className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Status: {statusFilter || 'All'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleStatusFilter("")}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilter("UNPAID")}>
                      Unpaid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilter("PARTIALLY_PAID")}>
                      Partially Paid
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilter("OVERDUE")}>
                      Overdue
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusFilter("PAID")}>
                      Paid
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="flex justify-center items-center p-4">
                  <p className="text-red-500">Error: {error}</p>
                </div>
              ) : data?.invoices && data.invoices.length > 0 ? (
                <>
                  <div className="rounded-md border flex-1 flex flex-col">
                    <div className="overflow-auto flex-1">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background/50 z-10">
                          <TableRow>
                            <SortableTableHead field="invoice">Invoice #</SortableTableHead>
                            <SortableTableHead field="spk">SPK</SortableTableHead>
                            <SortableTableHead field="invoiceDate">Invoice Date</SortableTableHead>
                            <SortableTableHead field="dueDate">Due Date</SortableTableHead>
                            <TableHead>Customer</TableHead>
                            <SortableTableHead field="total">Amount</SortableTableHead>
                            <SortableTableHead field="amountPaid">Paid</SortableTableHead>
                            <SortableTableHead field="balance">Balance</SortableTableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.invoices.map((invoice) => (
                            <TableRow key={invoice.id} className={isOverdue(invoice.dueDate) && invoice.status !== 'PAID' ? 'bg-red-50 dark:bg-red-950/20' : 'hover:bg-muted/50'}>
                              <TableCell>
                                {invoice.order?.invoice || "-"}
                              </TableCell>
                              <TableCell>{invoice.order?.spk || '-'}</TableCell>
                              <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                              <TableCell>{invoice.customer?.nama || 'N/A'}</TableCell>
                              <TableCell>{formatCurrency(invoice.total)}</TableCell>
                              <TableCell>{formatCurrency(invoice.amountPaid)}</TableCell>
                              <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <ChevronsUpDown className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                        View Details
                                      </DropdownMenuItem>
                                      {invoice.status !== "PAID" && (
                                        <DropdownMenuItem onClick={() => handleRecordPayment(invoice)}>
                                          Record Payment
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => {
                                          toast.info("Send reminder functionality would be implemented here");
                                        }}
                                      >
                                        Send Reminder
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Showing <span className="font-medium">{data.invoices.length}</span> of{" "}
                          <span className="font-medium">{data.pagination.totalCount}</span> invoices
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(1)}
                          disabled={page === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <ChevronLeft className="h-4 w-4 -ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1 || loading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm font-medium">
                          Page {page} of {data.pagination.totalPages || 1}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page >= data.pagination.totalPages || loading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePageChange(data.pagination.totalPages)}
                          disabled={page >= data.pagination.totalPages || loading}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4 -ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center p-8">
                  <p className="text-muted-foreground">No invoices found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment History</CardTitle>
              <div className="flex items-center space-x-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search payments..."
                    value={transactionSearch}
                    onChange={handleTransactionSearch}
                    className="pl-8"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={fetchTransactions}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <>
                  <div className="rounded-md border flex-1 flex flex-col">
                    <div className="overflow-auto flex-1">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background/50 z-10">
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>SPK</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction: any) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatDate(transaction.date)}</TableCell>
                              <TableCell>{(transaction.invoiceNumber && !transaction.invoiceNumber.startsWith('INV-')) ? transaction.invoiceNumber : '-'}</TableCell>
                              <TableCell>
                                {transaction.invoiceNumber?.startsWith('INV-') 
                                  ? transaction.invoiceNumber.replace('INV-', '') 
                                  : (transaction.orderId ? `#${transaction.orderId}` : '-')}
                              </TableCell>
                              <TableCell>{transaction.customerName}</TableCell>
                              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell>{formatPaymentMethod(transaction.paymentMethod)}</TableCell>
                              <TableCell>{getStatusBadge("PAID")}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleViewReceipt(transaction)}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Receipt
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          Showing <span className="font-medium">{transactions.length}</span> of{" "}
                          <span className="font-medium">{totalTransactions}</span> payments
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaymentsPageChange(1)}
                          disabled={paymentsPage === 1 || transactionsLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <ChevronLeft className="h-4 w-4 -ml-2" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaymentsPageChange(paymentsPage - 1)}
                          disabled={paymentsPage === 1 || transactionsLoading}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <span className="text-sm font-medium">
                          Page {paymentsPage} of {totalTransactionPages || 1}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaymentsPageChange(paymentsPage + 1)}
                          disabled={paymentsPage >= totalTransactionPages || transactionsLoading}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaymentsPageChange(totalTransactionPages)}
                          disabled={paymentsPage >= totalTransactionPages || transactionsLoading}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <ChevronRight className="h-4 w-4 -ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex justify-center items-center p-8">
                  <p className="text-muted-foreground">No payment records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {showInvoiceDetails && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowInvoiceDetails(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-4xl mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold">Invoice #{selectedInvoice.invoiceNumber}</h2>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedInvoice.invoiceDate)} · {selectedInvoice.customer?.nama || 'N/A'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInvoiceDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase">Customer Information</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{selectedInvoice.customer?.nama || 'N/A'}</p>
                    {selectedInvoice.customer?.phone && (
                      <p className="text-muted-foreground">{selectedInvoice.customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase">Invoice Details</h3>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedInvoice.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(selectedInvoice.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Order Information</h3>
                <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Order Number:</span>
                      <span>#{selectedInvoice.order?.spk || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Products:</span>
                      <span>{selectedInvoice.order?.produk || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="space-y-3 pt-4 border-t border-border/40">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Financial Summary</h3>
                <div className="text-sm rounded-lg border border-border/40 overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 p-3 border-b border-border/40">
                    <p>Subtotal:</p>
                    <p className="text-right">{formatCurrency(selectedInvoice.subtotal)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 border-b border-border/40">
                    <p>Tax:</p>
                    <p className="text-right">{formatCurrency(selectedInvoice.tax)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 border-b border-border/40 bg-muted/50">
                    <p className="font-medium">Total:</p>
                    <p className="text-right font-medium">{formatCurrency(selectedInvoice.total)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 border-b border-border/40">
                    <p>Paid:</p>
                    <p className="text-right text-green-600 dark:text-green-400">{formatCurrency(selectedInvoice.amountPaid)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50">
                    <p className="font-medium">Balance Due:</p>
                    <p className="text-right font-medium text-red-600 dark:text-red-400">
                      {formatCurrency(selectedInvoice.balance)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Payment History */}
              {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-border/40">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase">Payment History</h3>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.transactions.map((transaction, i) => (
                          <TableRow key={i}>
                            <TableCell>{formatDate(transaction.date)}</TableCell>
                            <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                            <TableCell>{formatPaymentMethod(transaction.paymentMethod)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2 pt-4 border-t border-border/40">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">Notes</h3>
                <div className="text-sm p-3 rounded-md bg-muted">
                  {selectedInvoice.notes || "No notes available."}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-border/40 bg-muted/30">
              <Button variant="outline" onClick={() => setShowInvoiceDetails(false)}>
                Close
              </Button>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={() => {
                  setShowInvoiceDetails(false);
                  setShowPaymentForm(true);
                }}>
                  <Receipt className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showPaymentForm && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPaymentForm(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold">Record Payment</h2>
                <p className="text-sm text-muted-foreground">
                  Process payment for invoice #{selectedInvoice.invoiceNumber}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPaymentForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              <PaymentForm 
                invoice={selectedInvoice} 
                onClose={() => setShowPaymentForm(false)} 
                onSuccess={handlePaymentSuccess} 
              />
            </div>
          </div>
        </div>
      )}
      
      {showReceipt && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowReceipt(false)}
          />

          {/* Modal */}
          <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-5xl mx-4 overflow-auto max-h-[90vh]">
            <div className="p-6">
              <PaymentReceipt 
                transaction={selectedTransaction} 
                onClose={() => setShowReceipt(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}