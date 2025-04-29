"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  Clock,
  Plus,
  Calendar,
  FileText
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Transaction {
  id: string;
  transactionNumber: string;
  date: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  paymentMethod: string | null;
  status: string;
  account: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface CashAccount {
  id: string;
  name: string;
  code: string;
  type: string;
  subtype: string;
  balance: number;
}

interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

export default function CashManagementPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('month');
  const [selectedAccountId, setSelectedAccountId] = useState('ALL');
  const [summary, setSummary] = useState({
    totalCashBalance: 0,
    periodInflows: 0,
    periodOutflows: 0,
    netCashFlow: 0,
    inflowCount: 0,
    outflowCount: 0
  });
  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashFlowByDay, setCashFlowByDay] = useState<CashFlowData[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [transactionData, setTransactionData] = useState({
    type: 'INCOME',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: '',
    referenceNumber: '',
    accountId: '',
    notes: ''
  });

  useEffect(() => {
    fetchCashData();
  }, [period, selectedAccountId]);

  const fetchCashData = async () => {
    try {
      setLoading(true);
      
      let queryParams = new URLSearchParams();
      queryParams.append("period", period);
      if (selectedAccountId && selectedAccountId !== 'ALL') queryParams.append("accountId", selectedAccountId);
      
      const response = await fetch(`/api/finance/cash?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching cash data: ${response.status}`);
      }
      
      const data = await response.json();
      
      setSummary({
        totalCashBalance: data.summary?.totalCashBalance ?? 0,
        periodInflows: data.summary?.periodInflows ?? 0,
        periodOutflows: data.summary?.periodOutflows ?? 0,
        netCashFlow: data.summary?.netCashFlow ?? 0,
        inflowCount: data.summary?.inflowCount ?? 0,
        outflowCount: data.summary?.outflowCount ?? 0
      });
      
      setAccounts(data.cashAccounts || []);
      setTransactions(data.recentTransactions || []);
      setCashFlowByDay(data.cashFlowByDay || []);
      
    } catch (err) {
      console.error("Failed to fetch cash data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      
      // Set fallback empty data
      setSummary({
        totalCashBalance: 0,
        periodInflows: 0,
        periodOutflows: 0,
        netCashFlow: 0,
        inflowCount: 0,
        outflowCount: 0
      });
      setTransactions([]);
      setCashFlowByDay([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const handleTransactionChange = (field: string, value: string) => {
    setTransactionData({ ...transactionData, [field]: value });
  };

  const handleCreateTransaction = async () => {
    try {
      // Validate required fields
      const { type, amount, description, date, accountId } = transactionData;
      
      if (!type || !amount || !description || !date || !accountId) {
        setError("Please fill in all required fields");
        return;
      }
      
      const response = await fetch('/api/finance/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating transaction: ${response.status}`);
      }
      
      // Reset form and close dialog
      setTransactionData({
        type: 'INCOME',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: '',
        referenceNumber: '',
        accountId: '',
        notes: ''
      });
      setShowAddDialog(false);
      
      // Refresh data
      fetchCashData();
      
    } catch (err) {
      console.error("Failed to create transaction:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cash Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Period:</Label>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Account:</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Transaction</DialogTitle>
                <DialogDescription>
                  Record a new cash transaction
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Type</Label>
                    <Select 
                      value={transactionData.type}
                      onValueChange={(value) => handleTransactionChange('type', value)}
                    >
                      <SelectTrigger id="transaction-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-amount">Amount</Label>
                    <Input 
                      id="transaction-amount" 
                      value={transactionData.amount}
                      onChange={(e) => handleTransactionChange('amount', e.target.value)}
                      placeholder="0.00" 
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-description">Description</Label>
                  <Input 
                    id="transaction-description" 
                    value={transactionData.description}
                    onChange={(e) => handleTransactionChange('description', e.target.value)}
                    placeholder="Transaction description" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-date">Date</Label>
                    <Input 
                      id="transaction-date" 
                      value={transactionData.date}
                      onChange={(e) => handleTransactionChange('date', e.target.value)}
                      type="date" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transaction-category">Category</Label>
                    <Input 
                      id="transaction-category" 
                      value={transactionData.category}
                      onChange={(e) => handleTransactionChange('category', e.target.value)}
                      placeholder="Category" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-account">Account</Label>
                  <Select 
                    value={transactionData.accountId}
                    onValueChange={(value) => handleTransactionChange('accountId', value)}
                  >
                    <SelectTrigger id="transaction-account">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({formatCurrency(account.balance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-method">Payment Method</Label>
                  <Select 
                    value={transactionData.paymentMethod}
                    onValueChange={(value) => handleTransactionChange('paymentMethod', value)}
                  >
                    <SelectTrigger id="transaction-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-reference">Reference Number</Label>
                  <Input 
                    id="transaction-reference" 
                    value={transactionData.referenceNumber}
                    onChange={(e) => handleTransactionChange('referenceNumber', e.target.value)}
                    placeholder="e.g. Invoice or Receipt Number" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-notes">Notes</Label>
                  <Textarea 
                    id="transaction-notes" 
                    value={transactionData.notes}
                    onChange={(e) => handleTransactionChange('notes', e.target.value)}
                    placeholder="Additional notes..." 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTransaction}>
                  Save Transaction
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalCashBalance)}</div>
                <p className="text-xs text-muted-foreground">Across {accounts.length} accounts</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inflows</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.periodInflows)}</div>
                <p className="text-xs text-muted-foreground">{summary.inflowCount} transactions</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Outflows</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.periodOutflows)}</div>
                <p className="text-xs text-muted-foreground">{summary.outflowCount} transactions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : cashFlowByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cashFlowByDay}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), '']} 
                    labelFormatter={(label) => `Date: ${formatDate(label as string)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="inflow" stroke="#4ade80" name="Income" />
                  <Line type="monotone" dataKey="outflow" stroke="#f87171" name="Expense" />
                  <Line type="monotone" dataKey="netFlow" stroke="#8884d8" name="Net Flow" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No cash flow data available for the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className={transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'INCOME' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell>{transaction.type === 'INCOME' ? 'Income' : 'Expense'}</TableCell>
                    <TableCell>{transaction.account?.name || 'N/A'}</TableCell>
                    <TableCell>{transaction.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions found</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                Record your first transaction
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}