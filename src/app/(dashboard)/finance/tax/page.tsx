"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaxFiling {
  id: string;
  type: string;
  period: string;
  dueDate: string;
  amount: number;
  status: string;
  paymentDate?: string;
  notes?: string;
}

export default function TaxManagementPage() {
  const [taxFilings, setTaxFilings] = useState<TaxFiling[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [formData, setFormData] = useState({
    type: "",
    period: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    fetchTaxFilings();
  }, []);

  const fetchTaxFilings = async () => {
    try {
      const response = await fetch("/api/finance/tax");
      if (!response.ok) throw new Error("Failed to fetch tax filings");
      const data = await response.json();
      setTaxFilings(data);
    } catch (error) {
      console.error("Error fetching tax filings:", error);
      toast.error("Failed to load tax filings");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/finance/tax", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          dueDate: selectedDate,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!response.ok) throw new Error("Failed to create tax filing");
      
      toast.success("Tax filing created successfully");
      setFormData({
        type: "",
        period: "",
        amount: "",
        notes: "",
      });
      setSelectedDate(undefined);
      fetchTaxFilings();
    } catch (error) {
      console.error("Error creating tax filing:", error);
      toast.error("Failed to create tax filing");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "text-green-500";
      case "pending":
        return "text-yellow-500";
      case "overdue":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tax Management</h1>
        <Button>Generate Reports</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxFilings
                .filter((filing) => filing.status === "pending")
                .reduce((sum, filing) => sum + filing.amount, 0)
                .toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxFilings.filter((filing) => filing.status === "overdue").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxFilings
                .filter(
                  (filing) =>
                    filing.status === "paid" &&
                    new Date(filing.paymentDate!).getMonth() === new Date().getMonth()
                )
                .reduce((sum, filing) => sum + filing.amount, 0)
                .toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {taxFilings.filter((filing) => filing.status === "pending").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Tax Filing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tax Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income Tax</SelectItem>
                    <SelectItem value="vat">VAT</SelectItem>
                    <SelectItem value="withholding">Withholding Tax</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <Input
                  id="period"
                  name="period"
                  value={formData.period}
                  onChange={handleInputChange}
                  placeholder="e.g., Q1 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Tax Filing
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tax Filings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxFilings.map((filing) => (
                  <TableRow key={filing.id}>
                    <TableCell>{filing.type}</TableCell>
                    <TableCell>{filing.period}</TableCell>
                    <TableCell>
                      {filing.amount.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                      })}
                    </TableCell>
                    <TableCell>{format(new Date(filing.dueDate), "PPP")}</TableCell>
                    <TableCell className={getStatusColor(filing.status)}>
                      {filing.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}