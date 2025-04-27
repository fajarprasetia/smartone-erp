"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface CashAccount {
  id: string;
  name: string;
  balance: number;
  transactions: CashTransaction[];
}

interface CashTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'PAYOUT';
  amount: number;
  description: string;
  date: string;
}

interface Order {
  nominal: number;
  date: string;
  description: string;
}

export default function CashManagementPage() {
  const router = useRouter();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mainCash, setMainCash] = useState<CashAccount | null>(null);
  const [paidOrders, setPaidOrders] = useState<Order[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [payouts, setPayouts] = useState<CashTransaction[]>([]);
  const [showPettyCashForm, setShowPettyCashForm] = useState(false);
  const [showMainCashForm, setShowMainCashForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'INCOME',
    amount: '',
    description: '',
    accountId: '',
    payableId: ''
  });

  useEffect(() => {
    fetchCashData();
  }, [date]);

  async function fetchCashData() {
    try {
      const response = await fetch(`/api/finance/cash?date=${date}`);
      if (!response.ok) throw new Error('Failed to fetch cash data');
      const data = await response.json();
      setMainCash(data.mainCash);
      setPaidOrders(data.paidOrders);
      setTotalIncome(data.totalIncome);
      setPayouts(data.payouts);
    } catch (error) {
      console.error('Error fetching cash data:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch('/api/finance/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date
        })
      });

      if (!response.ok) throw new Error('Failed to create transaction');

      setFormData({
        type: 'INCOME',
        amount: '',
        description: '',
        accountId: '',
        payableId: ''
      });
      setShowPettyCashForm(false);
      setShowMainCashForm(false);
      setShowPayoutForm(false);
      fetchCashData();
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  }

  const remainingBalance = mainCash?.balance || 0;
  const hasRemainingBalance = remainingBalance > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cash Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowPettyCashForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Petty Cash
          </Button>
          <Button onClick={() => setShowMainCashForm(true)}>
            <DollarSign className="mr-2 h-4 w-4" />
            Add Main Cash
          </Button>
          {hasRemainingBalance && (
            <Button variant="destructive" onClick={() => setShowPayoutForm(true)}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Create Payout
            </Button>
          )}
        </div>
      </div>

      {hasRemainingBalance && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            There is a remaining balance of {formatCurrency(remainingBalance)} in the main cash account.
            Please create a payout to zero the balance.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Main Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mainCash?.balance || 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(payouts.reduce((sum, payout) => sum + payout.amount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Paid Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paidOrders.map((order) => (
                <TableRow key={`${order.date}-${order.description}`}>
                  <TableCell>{format(new Date(order.date), 'PPP')}</TableCell>
                  <TableCell>{order.description}</TableCell>
                  <TableCell className="text-green-600">
                    {formatCurrency(order.nominal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showPettyCashForm} onOpenChange={setShowPettyCashForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Petty Cash Transaction</DialogTitle>
            <DialogDescription>
              Record a new petty cash transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label>Amount</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showMainCashForm} onOpenChange={setShowMainCashForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Main Cash Transaction</DialogTitle>
            <DialogDescription>
              Record a new main cash transaction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Type</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label>Amount</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Transaction</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayoutForm} onOpenChange={setShowPayoutForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
            <DialogDescription>
              Create a payout to zero the main cash balance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label>Amount</label>
              <Input
                type="number"
                value={remainingBalance}
                disabled
                placeholder="Enter amount"
              />
            </div>
            <div className="space-y-2">
              <label>Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create Payout</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}