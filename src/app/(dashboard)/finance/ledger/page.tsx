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

// Mock data types
interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  description?: string;
  isActive: boolean;
}

interface FinancialPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  closedAt?: Date;
}

interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description?: string;
  reference?: string;
  status: string;
  periodId: string;
  items: JournalEntryItem[];
}

interface JournalEntryItem {
  id: string;
  journalEntryId: string;
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export default function GeneralLedgerPage() {
  const [activeTab, setActiveTab] = useState<string>("chart-of-accounts");
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isCreatingJournalEntry, setIsCreatingJournalEntry] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you would call your API here
      // const accountsResponse = await fetch("/api/finance/chart-of-accounts")
      // const periodsResponse = await fetch("/api/finance/periods")
      
      // Simulate API calls with dummy data
      setTimeout(() => {
        // Dummy account data
        const dummyAccounts: ChartOfAccount[] = [
          {
            id: "acc-1",
            code: "1000",
            name: "Cash",
            type: "ASSET",
            subtype: "Current Asset",
            isActive: true
          },
          {
            id: "acc-2",
            code: "1100",
            name: "Accounts Receivable",
            type: "ASSET",
            subtype: "Current Asset",
            isActive: true
          },
          {
            id: "acc-3",
            code: "1200",
            name: "Inventory",
            type: "ASSET",
            subtype: "Current Asset",
            isActive: true
          },
          {
            id: "acc-4",
            code: "2000",
            name: "Accounts Payable",
            type: "LIABILITY",
            subtype: "Current Liability",
            isActive: true
          },
          {
            id: "acc-5",
            code: "3000",
            name: "Equity",
            type: "EQUITY",
            isActive: true
          },
          {
            id: "acc-6",
            code: "4000",
            name: "Revenue",
            type: "REVENUE",
            isActive: true
          },
          {
            id: "acc-7",
            code: "5000",
            name: "Cost of Goods Sold",
            type: "EXPENSE",
            isActive: true
          },
          {
            id: "acc-8",
            code: "5100",
            name: "Salaries Expense",
            type: "EXPENSE",
            isActive: true
          }
        ];
        
        // Dummy period data
        const dummyPeriods: FinancialPeriod[] = [
          {
            id: "period-1",
            name: "Q1 2023",
            startDate: new Date(2023, 0, 1),
            endDate: new Date(2023, 2, 31),
            isClosed: true,
            closedAt: new Date(2023, 3, 10)
          },
          {
            id: "period-2",
            name: "Q2 2023",
            startDate: new Date(2023, 3, 1),
            endDate: new Date(2023, 5, 30),
            isClosed: true,
            closedAt: new Date(2023, 6, 10)
          },
          {
            id: "period-3",
            name: "Q3 2023",
            startDate: new Date(2023, 6, 1),
            endDate: new Date(2023, 8, 30),
            isClosed: false
          },
          {
            id: "period-4",
            name: "Q4 2023",
            startDate: new Date(2023, 9, 1),
            endDate: new Date(2023, 11, 31),
            isClosed: false
          }
        ];
        
        setAccounts(dummyAccounts);
        setPeriods(dummyPeriods);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to fetch general ledger data:", error);
      toast.error("Failed to load general ledger data. Please try again.");
      setIsLoading(false);
    }
  };

  const handleAddAccount = () => {
    setIsCreatingAccount(true);
  };

  const handleEditAccount = (account: ChartOfAccount) => {
    setSelectedAccount(account);
    setIsEditingAccount(true);
  };

  const handleDeleteAccount = async (account: ChartOfAccount) => {
    try {
      const confirmed = window.confirm(`Are you sure you want to delete the account "${account.name}"?`);
      
      if (confirmed) {
        // In a real implementation, you would call your API here
        // await fetch(`/api/finance/chart-of-accounts/${account.id}`, {
        //   method: "DELETE"
        // })
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        toast.success(`Account "${account.name}" deleted successfully`);
        fetchData(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error("Failed to delete account. Please try again.");
    }
  };

  const handleViewTransactions = (account: ChartOfAccount) => {
    // In a real implementation, you would navigate to a page showing all transactions for this account
    toast.info(`Viewing transactions for account "${account.name}"`);
  };

  const handleCreateJournalEntry = () => {
    setIsCreatingJournalEntry(true);
  };

  const handleJournalEntrySubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      
      // In a real implementation, you would call your API here
      // await fetch("/api/finance/journal-entries", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(values)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Journal entry created successfully");
      setIsCreatingJournalEntry(false);
      
      // Switch to the journal entries tab and refresh the data
      setActiveTab("journal-entries");
      fetchData();
    } catch (error) {
      console.error("Failed to create journal entry:", error);
      toast.error("Failed to create journal entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">General Ledger</h1>
        <div className="flex space-x-2">
          {activeTab === "chart-of-accounts" && (
            <Button onClick={handleAddAccount}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          )}
          {activeTab === "journal-entries" && (
            <Button onClick={handleCreateJournalEntry}>
              <FileText className="h-4 w-4 mr-2" />
              New Journal Entry
            </Button>
          )}
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="chart-of-accounts" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart-of-accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chart-of-accounts">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <ChartOfAccounts
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onViewTransactions={handleViewTransactions}
            />
          )}
        </TabsContent>
        
        <TabsContent value="journal-entries">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search journal entries..."
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="rounded-md border">
                <p className="p-8 text-center text-muted-foreground">
                  Journal entries functionality to be implemented
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trial-balance">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  Select a period to view the trial balance
                </div>
                <Button variant="outline">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="rounded-md border">
                <p className="p-8 text-center text-muted-foreground">
                  Trial balance functionality to be implemented
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialog for creating a journal entry */}
      <Dialog open={isCreatingJournalEntry} onOpenChange={setIsCreatingJournalEntry}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Journal Entry</DialogTitle>
          </DialogHeader>
          <JournalEntryForm
            accounts={accounts}
            periods={periods}
            isSubmitting={isSubmitting}
            onSubmit={handleJournalEntrySubmit}
            onCancel={() => setIsCreatingJournalEntry(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Dialog for creating/editing an account would go here */}
    </div>
  );
}