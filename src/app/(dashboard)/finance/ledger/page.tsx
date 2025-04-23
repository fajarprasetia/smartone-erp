"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  FileText,
  Plus,
  Calendar,
  Search,
  Filter,
  BookOpen,
  BadgeCheck,
  Clock,
  RefreshCw
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype: string;
  balance: number;
  isActive: boolean;
}

interface JournalEntryItem {
  id: string;
  journalEntryId: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
  account: Account;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string | null;
  status: string;
  periodId: string;
  items: JournalEntryItem[];
  period: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
  };
}

interface FinancialPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
}

export default function GeneralLedgerPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriod | null>(null);
  const [summary, setSummary] = useState({
    totalDebits: 0,
    totalCredits: 0,
    draftEntriesCount: 0,
    postedEntriesCount: 0
  });
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10
  });
  const [filters, setFilters] = useState({
    accountId: '',
    periodId: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    reference: '',
    status: 'DRAFT',
    periodId: ''
  });
  const [entryItems, setEntryItems] = useState<{accountId: string; description: string; debit: string; credit: string}[]>([
    { accountId: "", description: "", debit: "", credit: "" },
    { accountId: "", description: "", debit: "", credit: "" }
  ]);

  useEffect(() => {
    fetchLedgerData();
  }, [filters, pagination.currentPage, pagination.pageSize]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      
      let queryParams = new URLSearchParams();
      if (filters.accountId) queryParams.append("accountId", filters.accountId);
      if (filters.periodId) queryParams.append("periodId", filters.periodId);
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      
      queryParams.append("page", pagination.currentPage.toString());
      queryParams.append("pageSize", pagination.pageSize.toString());
      
      const response = await fetch(`/api/finance/ledger?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching ledger data: ${response.status}`);
      }
      
      const data = await response.json();
      
      setJournalEntries(data.journalEntries || []);
      setPeriods(data.financialPeriods || []);
      setAccounts(data.accounts || []);
      setCurrentPeriod(data.currentPeriod || null);
      
      setSummary({
        totalDebits: data.summary.totalDebits || 0,
        totalCredits: data.summary.totalCredits || 0,
        draftEntriesCount: data.summary.draftEntriesCount || 0,
        postedEntriesCount: data.summary.postedEntriesCount || 0
      });
      
      setPagination({
        totalCount: data.pagination.totalCount || 0,
        totalPages: data.pagination.totalPages || 0,
        currentPage: data.pagination.currentPage || 1,
        pageSize: data.pagination.pageSize || 10
      });
      
      // Set default period in form if current period is available
      if (data.currentPeriod && !formData.periodId) {
        setFormData(prev => ({
          ...prev,
          periodId: data.currentPeriod.id
        }));
      }
      
    } catch (err) {
      console.error("Failed to fetch ledger data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntryDetails = async (entryId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/finance/ledger?id=${entryId}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching entry details: ${response.status}`);
      }
      
      const data = await response.json();
      setActiveEntryId(entryId);
      
      return data;
      
    } catch (err) {
      console.error("Failed to fetch entry details:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const addEntryItem = () => {
    setEntryItems([...entryItems, { accountId: "", description: "", debit: "", credit: "" }]);
  };

  const removeEntryItem = (index: number) => {
    if (entryItems.length > 2) {
      const updatedItems = [...entryItems];
      updatedItems.splice(index, 1);
      setEntryItems(updatedItems);
    }
  };

  const handleEntryItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...entryItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If debit is entered, clear credit and vice versa
    if (field === 'debit' && value) {
      updatedItems[index].credit = '';
    } else if (field === 'credit' && value) {
      updatedItems[index].debit = '';
    }
    
    setEntryItems(updatedItems);
  };

  const calculateTotals = () => {
    const totalDebit = entryItems.reduce((sum, item) => sum + (parseFloat(item.debit) || 0), 0);
    const totalCredit = entryItems.reduce((sum, item) => sum + (parseFloat(item.credit) || 0), 0);
    
    return {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01 // Allow for rounding errors
    };
  };

  const handleCreateEntry = async () => {
    try {
      // Validate required fields
      if (!formData.date || !formData.description || !formData.periodId) {
        setError("Date, description, and period are required");
        return;
      }
      
      // Validate at least two items
      if (entryItems.length < 2) {
        setError("At least two journal entry items are required");
        return;
      }
      
      // Validate that each item has an account and either debit or credit
      const invalidItems = entryItems.filter(item => 
        !item.accountId || (!item.debit && !item.credit)
      );
      
      if (invalidItems.length > 0) {
        setError("All journal entry items must have an account and either debit or credit");
        return;
      }
      
      // Validate that debits equal credits
      const { totalDebit, totalCredit, isBalanced } = calculateTotals();
      
      if (!isBalanced) {
        setError(`Debits (${formatCurrency(totalDebit)}) must equal credits (${formatCurrency(totalCredit)})`);
        return;
      }
      
      const response = await fetch('/api/finance/ledger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: entryItems.map(item => ({
            accountId: item.accountId,
            description: item.description,
            debit: parseFloat(item.debit) || 0,
            credit: parseFloat(item.credit) || 0
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating journal entry: ${response.status}`);
      }
      
      // Reset form and close dialog
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        description: '',
        reference: '',
        status: 'DRAFT',
        periodId: currentPeriod?.id || ''
      });
      setEntryItems([
        { accountId: "", description: "", debit: "", credit: "" },
        { accountId: "", description: "", debit: "", credit: "" }
      ]);
      setShowCreateDialog(false);
      
      // Refresh data
      fetchLedgerData();
      
    } catch (err) {
      console.error("Failed to create journal entry:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      case 'POSTED':
        return <Badge variant="success">Posted</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">General Ledger</h1>
        <div className="flex items-center gap-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Journal Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
                <DialogDescription>
                  Create a new journal entry with balanced debits and credits.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry-date">Date</Label>
                    <Input 
                      id="entry-date" 
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleFormChange('date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-period">Financial Period</Label>
                    <Select 
                      value={formData.periodId}
                      onValueChange={(value) => handleFormChange('periodId', value)}
                    >
                      <SelectTrigger id="entry-period">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((period) => (
                          <SelectItem 
                            key={period.id} 
                            value={period.id}
                            disabled={period.isClosed}
                          >
                            {period.name} {period.isClosed ? '(Closed)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entry-description">Description</Label>
                  <Input 
                    id="entry-description" 
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Journal entry description" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entry-reference">Reference</Label>
                    <Input 
                      id="entry-reference" 
                      value={formData.reference}
                      onChange={(e) => handleFormChange('reference', e.target.value)}
                      placeholder="Optional reference" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entry-status">Status</Label>
                    <Select 
                      value={formData.status}
                      onValueChange={(value) => handleFormChange('status', value)}
                    >
                      <SelectTrigger id="entry-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="POSTED">Posted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Journal Entry Items</h3>
                  <div className={`font-semibold text-md ${calculateTotals().isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    Debit: {formatCurrency(calculateTotals().totalDebit)} | 
                    Credit: {formatCurrency(calculateTotals().totalCredit)}
                  </div>
                </div>
                <div className="border rounded-md p-4 space-y-4">
                  <div className="grid grid-cols-12 gap-3 font-medium text-sm">
                    <div className="col-span-4">Account</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-1">Debit</div>
                    <div className="col-span-1">Credit</div>
                    <div className="col-span-1"></div>
                  </div>
                  {entryItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4">
                        <Select 
                          value={item.accountId}
                          onValueChange={(value) => handleEntryItemChange(index, 'accountId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Input 
                          value={item.description}
                          onChange={(e) => handleEntryItemChange(index, 'description', e.target.value)}
                          placeholder="Description" 
                        />
                      </div>
                      <div className="col-span-1">
                        <Input 
                          value={item.debit}
                          onChange={(e) => handleEntryItemChange(index, 'debit', e.target.value)}
                          placeholder="0.00" 
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input 
                          value={item.credit}
                          onChange={(e) => handleEntryItemChange(index, 'credit', e.target.value)}
                          placeholder="0.00" 
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button 
                          variant="ghost" 
                          className="px-2" 
                          onClick={() => removeEntryItem(index)}
                          disabled={entryItems.length <= 2}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={addEntryItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateEntry}
                  disabled={!calculateTotals().isBalanced}
                >
                  Create Journal Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalDebits)}</div>
                <p className="text-xs text-muted-foreground">From {journalEntries.length} journal entries</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalCredits)}</div>
                <p className="text-xs text-muted-foreground">From {journalEntries.length} journal entries</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.draftEntriesCount}</div>
                <p className="text-xs text-muted-foreground">Entries waiting to be posted</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posted Entries</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.postedEntriesCount}</div>
                <p className="text-xs text-muted-foreground">Entries posted to the ledger</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-account">Account:</Label>
              <Select 
                value={filters.accountId}
                onValueChange={(value) => handleFilterChange('accountId', value)}
              >
                <SelectTrigger id="filter-account" className="w-[200px]">
                  <SelectValue placeholder="All Accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-period">Period:</Label>
              <Select 
                value={filters.periodId}
                onValueChange={(value) => handleFilterChange('periodId', value)}
              >
                <SelectTrigger id="filter-period" className="w-[150px]">
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Periods</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-status">Status:</Label>
              <Select 
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger id="filter-status" className="w-[120px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-start-date">From:</Label>
              <Input 
                id="filter-start-date" 
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="filter-end-date">To:</Label>
              <Input 
                id="filter-end-date" 
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <Button 
              variant="outline"
              className="ml-auto"
              onClick={() => {
                setFilters({
                  accountId: '',
                  periodId: '',
                  status: '',
                  startDate: '',
                  endDate: ''
                });
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : journalEntries.length > 0 ? (
            <>
              <Tabs defaultValue="list" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="list">List View</TabsTrigger>
                  <TabsTrigger value="detail" disabled={!activeEntryId}>Detail View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="list">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entry Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                          <TableCell>{formatDate(entry.date)}</TableCell>
                          <TableCell>{entry.description}</TableCell>
                          <TableCell>{formatCurrency(entry.items.reduce((sum, item) => sum + item.debit, 0))}</TableCell>
                          <TableCell>{entry.period.name}</TableCell>
                          <TableCell>{getStatusBadge(entry.status)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={async () => {
                                await fetchEntryDetails(entry.id);
                                document.querySelector('[data-value="detail"]')?.click();
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {journalEntries.length} of {pagination.totalCount} entries
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage <= 1}
                      >
                        Previous
                      </Button>
                      <div className="text-sm">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage >= pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="detail">
                  {activeEntryId && (
                    <div className="space-y-6">
                      {journalEntries.filter(entry => entry.id === activeEntryId).map(entry => (
                        <div key={entry.id} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="pt-6">
                                <dl className="grid grid-cols-2 gap-4">
                                  <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Entry Number</dt>
                                    <dd className="text-base">{entry.entryNumber}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Date</dt>
                                    <dd className="text-base">{formatDate(entry.date)}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Period</dt>
                                    <dd className="text-base">{entry.period.name}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                                    <dd className="text-base">{getStatusBadge(entry.status)}</dd>
                                  </div>
                                  <div className="col-span-2">
                                    <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                                    <dd className="text-base">{entry.description}</dd>
                                  </div>
                                  {entry.reference && (
                                    <div className="col-span-2">
                                      <dt className="text-sm font-medium text-muted-foreground">Reference</dt>
                                      <dd className="text-base">{entry.reference}</dd>
                                    </div>
                                  )}
                                </dl>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="pt-6">
                                <div className="space-y-2">
                                  <h3 className="text-lg font-medium">Totals</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Debits</p>
                                      <p className="text-2xl font-bold">
                                        {formatCurrency(entry.items.reduce((sum, item) => sum + item.debit, 0))}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Credits</p>
                                      <p className="text-2xl font-bold">
                                        {formatCurrency(entry.items.reduce((sum, item) => sum + item.credit, 0))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Journal Entry Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Debit</TableHead>
                                    <TableHead className="text-right">Credit</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {entry.items.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <div className="font-medium">{item.account.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.account.code}</div>
                                      </TableCell>
                                      <TableCell>{item.description}</TableCell>
                                      <TableCell className="text-right">
                                        {item.debit > 0 ? formatCurrency(item.debit) : ''}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {item.credit > 0 ? formatCurrency(item.credit) : ''}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                                <tfoot>
                                  <tr>
                                    <td colSpan={2} className="text-right font-medium">Totals</td>
                                    <td className="text-right font-bold">
                                      {formatCurrency(entry.items.reduce((sum, item) => sum + item.debit, 0))}
                                    </td>
                                    <td className="text-right font-bold">
                                      {formatCurrency(entry.items.reduce((sum, item) => sum + item.credit, 0))}
                                    </td>
                                  </tr>
                                </tfoot>
                              </Table>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No journal entries found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                Create your first journal entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}