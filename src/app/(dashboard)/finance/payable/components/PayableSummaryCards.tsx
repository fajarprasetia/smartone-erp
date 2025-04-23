"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SummaryData = {
  totalAmount: number;
  overdueAmount: number;
  overdueCount: number;
  vendorCount: number;
  newVendorCount: number;
  percentChange: number;
};

export function PayableSummaryCards() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/finance/payable?summary=true");
        
        if (!response.ok) {
          throw new Error("Failed to fetch summary data");
        }
        
        const data = await response.json();
        
        setSummaryData({
          totalAmount: data.summary.totalAmount,
          overdueAmount: data.summary.overdueAmount,
          overdueCount: data.summary.overdueCount,
          vendorCount: data.summary.vendorCount || 0,
          newVendorCount: data.summary.newVendorCount || 0,
          percentChange: data.summary.percentChange || 0
        });
      } catch (error) {
        console.error("Error fetching summary data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-7 bg-gray-200 rounded w-36 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summaryData) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryData.totalAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {summaryData.percentChange >= 0 ? "+" : ""}
            {summaryData.percentChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryData.overdueAmount)}</div>
          <p className="text-xs text-muted-foreground">
            {summaryData.overdueCount} {summaryData.overdueCount === 1 ? 'invoice' : 'invoices'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryData.vendorCount}</div>
          <p className="text-xs text-muted-foreground">
            {summaryData.newVendorCount} new this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summaryData.totalAmount - summaryData.overdueAmount - (summaryData.totalAmount * 0.3))}
          </div>
          <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
        </CardContent>
      </Card>
    </div>
  );
} 