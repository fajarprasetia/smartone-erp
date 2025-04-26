"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PlusCircle,
  RefreshCw,
  FileText,
  Search,
  FileSpreadsheet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartOfAccounts } from "@/components/finance/chart-of-accounts";
import { JournalEntryForm } from "@/components/finance/journal-entry-form";
import { JournalEntriesList } from "@/components/finance/journal-entries-list";
import { TrialBalance } from "@/components/finance/trial-balance";
import type { ChartOfAccount, FinancialPeriod, JournalEntry } from "@/types/prisma";

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<string>("chart-of-accounts");
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJournalEntry, setIsCreatingJournalEntry] = useState(false);
  const [isEditingJournalEntry, setIsEditingJournalEntry] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would call your API here
      // For now, we'll simulate data loading
      
      const accountsResponse = await fetch("/api/finance/chart-of-accounts");
      const periodsResponse = await fetch("/api/finance/periods");
      
      if (!accountsResponse.ok || !periodsResponse.ok) {
        throw new Error("Failed to fetch general ledger data");
      }
      
      const accountsData = await accountsResponse.json();
      const periodsData = await periodsResponse.json();
      
      setAccounts(accountsData.accounts);
      setPeriods(periodsData.periods);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch general ledger data:", error);
      toast.error("Failed to load general ledger data. Please try again.");
      setIsLoading(false);
    }
  };

  const handleCreateJournalEntry = () => {
    setSelectedJournalEntry(null);
    setIsCreatingJournalEntry(true);
  };
  
  const handleEditJournalEntry = (entry: JournalEntry) => {
    setSelectedJournalEntry(entry);
    setIsEditingJournalEntry(true);
  };

  const handleJournalEntrySubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const method = selectedJournalEntry ? "PUT" : "POST";
      const url = selectedJournalEntry 
        ? `/api/finance/ledger/journal-entries?id=${selectedJournalEntry.id}`
        : "/api/finance/ledger/journal-entries";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save journal entry");
      }
      
      toast.success(
        selectedJournalEntry 
          ? "Journal entry updated successfully"
          : "Journal entry created successfully"
      );
      
      setIsCreatingJournalEntry(false);
      setIsEditingJournalEntry(false);
      setSelectedJournalEntry(null);
      
      // Refresh the journal entries list if that tab is active
      if (activeTab === "journal-entries") {
        // The useEffect will handle reloading data when needed
      }
    } catch (error) {
      console.error("Error submitting journal entry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save journal entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">General Ledger</h1>
        {activeTab === "journal-entries" && (
          <Button onClick={handleCreateJournalEntry}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        )}
        {activeTab === "chart-of-accounts" && (
          <Button onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>

      <Tabs 
        defaultValue="chart-of-accounts" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="chart-of-accounts">
          <ChartOfAccounts />
        </TabsContent>

        <TabsContent value="journal-entries">
          <JournalEntriesList
            onAddEntry={handleCreateJournalEntry}
            onEditEntry={handleEditJournalEntry}
          />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalance />
        </TabsContent>
      </Tabs>

      {/* Journal Entry Dialog */}
      <Dialog 
        open={isCreatingJournalEntry || isEditingJournalEntry} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreatingJournalEntry(false)
            setIsEditingJournalEntry(false)
            setSelectedJournalEntry(null)
          }
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isEditingJournalEntry ? "Edit Journal Entry" : "Create Journal Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-[40px] w-full" />
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[40px] w-full" />
              </div>
            ) : (
              <JournalEntryForm
                accounts={accounts} 
                periods={periods}
                entry={selectedJournalEntry as any}
                isSubmitting={isSubmitting}
                onSubmit={handleJournalEntrySubmit}
                onCancel={() => {
                  setIsCreatingJournalEntry(false)
                  setIsEditingJournalEntry(false)
                  setSelectedJournalEntry(null)
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}