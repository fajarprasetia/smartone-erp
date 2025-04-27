"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart, PieChart, DollarSign, CreditCard, Package, Plus, FileText, ListFilter } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface BudgetItem {
  id: string;
  accountId: string;
  description: string;
  amount: number;
  account: {
    id: string;
    name: string;
    accountNumber: string;
    type: string;
  };
}

interface Budget {
  id: string;
  name: string;
  year: number;
  description: string | null;
  totalAmount: number;
  department: {
    id: string;
    name: string;
  } | null;
  period: {
    id: string;
    name: string;
  } | null;
  items: BudgetItem[];
}

interface BudgetPerformance {
  year: number;
  accounts: {
    accountId: string;
    accountName: string;
    accountNumber: string;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }[];
}

interface Account {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string;
}

export default function BudgetsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBudgetItems, setNewBudgetItems] = useState<{accountId: string; description: string; amount: string}[]>([
    { accountId: "", description: "", amount: "" },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    description: "",
    departmentId: "",
  });
  const [summary, setSummary] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    remaining: 0,
    overBudgetCount: 0,
  });

  useEffect(() => {
    fetchBudgets();
    fetchAccounts();
  }, [selectedYear, selectedDepartment]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let queryParams = new URLSearchParams();
      if (selectedYear) queryParams.append("year", selectedYear);
      if (selectedDepartment) queryParams.append("departmentId", selectedDepartment);
      
      const response = await fetch(`/api/finance/budgets?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching budgets: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Initialize arrays with empty defaults if undefined
      const budgetsData = Array.isArray(data.budgets) ? data.budgets : [];
      const performanceData = Array.isArray(data.performance) ? data.performance : [];
      const departmentsData = Array.isArray(data.filters?.departments) ? data.filters.departments : [];
      const yearsData = Array.isArray(data.filters?.years) ? data.filters.years : [];
      
      // Set state with safe values
      setBudgets(budgetsData);
      setBudgetPerformance(performanceData);
      setDepartments(departmentsData);
      setYears(yearsData);
      
      // Calculate summary with null checks
      const totalBudgeted = budgetsData.reduce((sum: number, budget: Budget) => 
        sum + (budget.totalAmount || 0), 0);
      
      const totalSpent = performanceData.reduce((sum: number, yearData: BudgetPerformance) => 
        sum + (yearData.accounts || []).reduce((accSum: number, account) => 
          accSum + (account.actualAmount || 0), 0), 0);
      
      const overBudgetCount = performanceData.reduce((count: number, yearData: BudgetPerformance) => 
        count + (yearData.accounts || []).filter((account: any) => 
          (account.actualAmount || 0) > (account.budgetAmount || 0)).length, 0);
      
      setSummary({
        totalBudgeted,
        totalSpent,
        remaining: totalBudgeted - totalSpent,
        overBudgetCount
      });
      
    } catch (err) {
      console.error("Failed to fetch budgets:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      // Set empty arrays for all state in case of error
      setBudgets([]);
      setBudgetPerformance([]);
      setDepartments([]);
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/finance/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
      } else {
        console.error('Failed to fetch accounts:', response.status);
        setAccounts([]);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      setAccounts([]);
    }
  };

  const handleCreateBudget = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.year) {
        setError("Budget name and year are required");
        return;
      }
      
      // Validate at least one item with a valid amount
      const validItems = newBudgetItems.filter(item => 
        item.accountId && item.amount && parseFloat(item.amount) > 0
      );
      
      if (validItems.length === 0) {
        setError("At least one budget item with a valid amount is required");
        return;
      }
      
      const response = await fetch('/api/finance/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          year: parseInt(formData.year),
          description: formData.description,
          departmentId: formData.departmentId || undefined,
          items: newBudgetItems.map(item => ({
            accountId: item.accountId,
            description: item.description,
            amount: parseFloat(item.amount) || 0
          })).filter(item => item.accountId && item.amount > 0)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error creating budget: ${response.status}`);
      }
      
      // Reset form and close dialog
      setFormData({
        name: "",
        year: new Date().getFullYear().toString(),
        description: "",
        departmentId: "",
      });
      setNewBudgetItems([{ accountId: "", description: "", amount: "" }]);
      setShowCreateDialog(false);
      
      // Refresh budgets
      fetchBudgets();
      
    } catch (err) {
      console.error("Failed to create budget:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  const addBudgetItem = () => {
    setNewBudgetItems([...newBudgetItems, { accountId: "", description: "", amount: "" }]);
  };

  const removeBudgetItem = (index: number) => {
    if (newBudgetItems.length > 1) {
      const updatedItems = [...newBudgetItems];
      updatedItems.splice(index, 1);
      setNewBudgetItems(updatedItems);
    }
  };

  const handleBudgetItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...newBudgetItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewBudgetItems(updatedItems);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const calculateTotalBudgetAmount = () => {
    return newBudgetItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value === "ALL" ? "" : value);
  };

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value === "ALL" ? "" : value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>Year:</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Years</SelectItem>
                {Array.isArray(years) && years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Department:</Label>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Departments</SelectItem>
                {Array.isArray(departments) && departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>
                  Create a new budget with specified allocation across accounts.
                </DialogDescription>
              </DialogHeader>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-name">Budget Name</Label>
                    <Input 
                      id="budget-name" 
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Annual Marketing Budget" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget-year">Year</Label>
                    <Input 
                      id="budget-year" 
                      value={formData.year}
                      onChange={(e) => handleFormChange('year', e.target.value)}
                      placeholder="2023" 
                      type="number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-description">Description</Label>
                  <Textarea 
                    id="budget-description" 
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Budget description..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget-department">Department</Label>
                  <Select 
                    value={formData.departmentId}
                    onValueChange={(value: string) => handleFormChange('departmentId', value)}
                  >
                    <SelectTrigger id="budget-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      {Array.isArray(departments) && departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Budget Items</h3>
                  <div className="font-semibold text-md">
                    Total: {formatCurrency(calculateTotalBudgetAmount())}
                  </div>
                </div>
                <div className="border rounded-md p-4 space-y-4">
                  {newBudgetItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Label htmlFor={`account-${index}`}>Account</Label>
                        <Select 
                          value={item.accountId}
                          onValueChange={(value: string) => handleBudgetItemChange(index, 'accountId', value)}
                        >
                          <SelectTrigger id={`account-${index}`}>
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.isArray(accounts) && accounts.length > 0 ? (
                              accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.code} - {account.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-accounts" disabled>No accounts available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4">
                        <Label htmlFor={`description-${index}`}>Description</Label>
                        <Input 
                          id={`description-${index}`} 
                          value={item.description}
                          onChange={(e) => handleBudgetItemChange(index, 'description', e.target.value)}
                          placeholder="Description" 
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor={`amount-${index}`}>Amount</Label>
                        <Input 
                          id={`amount-${index}`} 
                          value={item.amount}
                          onChange={(e) => handleBudgetItemChange(index, 'amount', e.target.value)}
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
                          onClick={() => removeBudgetItem(index)}
                          disabled={newBudgetItems.length === 1}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={addBudgetItem}
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
                <Button onClick={handleCreateBudget}>
                  Create Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalBudgeted)}</div>
                <p className="text-xs text-muted-foreground">Across {budgets.length} budgets</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalSpent)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalBudgeted > 0 
                    ? `${Math.round((summary.totalSpent / summary.totalBudgeted) * 100)}% of total budget`
                    : "No budget allocated"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(summary.remaining)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalBudgeted > 0 
                    ? `${Math.round((summary.remaining / summary.totalBudgeted) * 100)}% of total budget`
                    : "No budget allocated"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Over Budget</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-36" />
            ) : (
              <>
                <div className="text-2xl font-bold">{summary.overBudgetCount}</div>
                <p className="text-xs text-muted-foreground">accounts over budget</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : Array.isArray(budgetPerformance) && budgetPerformance.length > 0 ? (
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={budgetPerformance.flatMap(yearData => 
                          yearData.accounts.map(account => ({
                            name: account.accountName,
                            budget: account.budgetAmount,
                            actual: account.actualAmount,
                            year: yearData.year
                          }))
                        )}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => `Account: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="budget" name="Budget" fill="#8884d8" />
                        <Bar dataKey="actual" name="Actual" fill="#82ca9d" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No budget data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Budget Categories</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : Array.isArray(budgets) && budgets.length > 0 ? (
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={budgets.map(budget => ({
                            name: budget.name,
                            value: budget.totalAmount
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {budgets.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No budget data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : Array.isArray(budgets) && budgets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.name}</TableCell>
                        <TableCell>{budget.year}</TableCell>
                        <TableCell>{budget.department?.name || "N/A"}</TableCell>
                        <TableCell>{formatCurrency(budget.totalAmount)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {budget.description || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4 mr-2" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No budgets found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    Create your first budget
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : Array.isArray(budgetPerformance) && budgetPerformance.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  {budgetPerformance.map((yearData) => (
                    <div key={yearData.year} className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Year: {yearData.year}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Budget</TableHead>
                            <TableHead>Actual</TableHead>
                            <TableHead>Variance</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(yearData.accounts) && yearData.accounts.map((account) => (
                            <TableRow key={account.accountId}>
                              <TableCell>
                                <div className="font-medium">{account.accountName}</div>
                                <div className="text-xs text-muted-foreground">{account.accountNumber}</div>
                              </TableCell>
                              <TableCell>{formatCurrency(account.budgetAmount)}</TableCell>
                              <TableCell>{formatCurrency(account.actualAmount)}</TableCell>
                              <TableCell className={
                                account.variance < 0 ? "text-red-500" : "text-green-500"
                              }>
                                {formatCurrency(account.variance)}
                                <span className="text-xs ml-1">
                                  ({account.variancePercentage}%)
                                </span>
                              </TableCell>
                              <TableCell>
                                {account.actualAmount > account.budgetAmount ? (
                                  <Badge variant="destructive">Over Budget</Badge>
                                ) : account.actualAmount >= account.budgetAmount * 0.9 ? (
                                  <Badge variant="warning">Near Limit</Badge>
                                ) : (
                                  <Badge variant="success">On Track</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}