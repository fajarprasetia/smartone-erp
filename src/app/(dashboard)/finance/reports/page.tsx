"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Loader2 } from "lucide-react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface FinancialData {
  cashFlow: {
    inflow: number;
    outflow: number;
    balance: number;
  };
  accountsReceivable: {
    total: number;
    overdue: number;
    upcoming: number;
  };
  accountsPayable: {
    total: number;
    overdue: number;
    upcoming: number;
  };
  taxes: {
    pending: number;
    paid: number;
    overdue: number;
  };
  budgets?: {
    allocated: number;
    spent: number;
    remaining: number;
  };
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
  expensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

export default function FinanceReportsPage() {
  const [date, setDate] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialData | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetchFinancialData();
  }, [date]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/finance/reports?' + new URLSearchParams({
        from: date.from.toISOString(),
        to: date.to.toISOString(),
      }));
      
      if (!response.ok) throw new Error('Failed to fetch financial data');
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/finance/reports/export?' + new URLSearchParams({
        from: date.from.toISOString(),
        to: date.to.toISOString(),
      }));
      
      if (!response.ok) throw new Error('Failed to export report');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${format(date.from, 'yyyy-MM-dd')}-to-${format(date.to, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Finance Reports</h1>
        <div className="flex gap-4">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
            Export Report
        </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="receivables">Receivables</TabsTrigger>
          <TabsTrigger value="payables">Payables</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Inflow</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.cashFlow.inflow || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Outflow</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.cashFlow.outflow || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Net Position</span>
                    <span className="font-bold">
                      {formatCurrency(data?.cashFlow.balance || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(data?.accountsReceivable.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.accountsReceivable.overdue || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Accounts Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(data?.accountsPayable.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.accountsPayable.overdue || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#0088FE" />
                    <Bar dataKey="expenses" name="Expenses" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.expensesByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.category}: ${formatCurrency(entry.value)}`}
                    >
                      {data?.expensesByCategory.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cash-flow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="revenue" name="Inflow" fill="#0088FE" />
                    <Bar dataKey="expenses" name="Outflow" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Opening Balance</span>
                    <span className="font-medium">
                      {formatCurrency(data?.cashFlow.balance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Inflow</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.cashFlow.inflow || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Outflow</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.cashFlow.outflow || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="font-bold">Closing Balance</span>
                    <span className="font-bold">
                      {formatCurrency((data?.cashFlow.balance || 0) + (data?.cashFlow.inflow || 0) - (data?.cashFlow.outflow || 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Receivables Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(data?.accountsReceivable.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overdue Amount</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.accountsReceivable.overdue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Upcoming Payments</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.accountsReceivable.upcoming || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receivables Aging</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Current", value: data?.accountsReceivable.upcoming || 0 },
                        { name: "Overdue", value: data?.accountsReceivable.overdue || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payables Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Outstanding</span>
                    <span className="font-medium">
                      {formatCurrency(data?.accountsPayable.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overdue Amount</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.accountsPayable.overdue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Upcoming Payments</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.accountsPayable.upcoming || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payables Aging</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Current", value: data?.accountsPayable.upcoming || 0 },
                        { name: "Overdue", value: data?.accountsPayable.overdue || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
                <CardTitle>Tax Overview</CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pending Taxes</span>
                    <span className="font-medium text-yellow-600">
                      {formatCurrency(data?.taxes.pending || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Paid Taxes</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.taxes.paid || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Overdue Taxes</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.taxes.overdue || 0)}
                    </span>
                  </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Pending", value: data?.taxes.pending || 0 },
                        { name: "Paid", value: data?.taxes.paid || 0 },
                        { name: "Overdue", value: data?.taxes.overdue || 0 },
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                    >
                      <Cell fill="#FFBB28" />
                      <Cell fill="#00C49F" />
                      <Cell fill="#FF8042" />
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
                <CardTitle>Budget Performance</CardTitle>
            </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Allocated</span>
                    <span className="font-medium">
                      {formatCurrency(data?.budgets?.allocated ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Spent</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(data?.budgets?.spent ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining Budget</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(data?.budgets?.remaining ?? 0)}
                    </span>
                  </div>
              </div>
            </CardContent>
          </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: "Allocated", value: data?.budgets?.allocated ?? 0 },
                    { name: "Spent", value: data?.budgets?.spent ?? 0 },
                    { name: "Remaining", value: data?.budgets?.remaining ?? 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}