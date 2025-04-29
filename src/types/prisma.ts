export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: string;
  subtype?: string;
  description?: string;
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: string;
  year: number;
  quarter?: number;
  month?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface JournalEntryItem {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description?: string | null;
  debit: number;
  credit: number;
  createdAt: Date;
  updatedAt: Date;
  account?: ChartOfAccount;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description?: string | null;
  reference?: string | null;
  status: string;
  periodId: string;
  periodName?: string;
  createdAt: Date;
  updatedAt: Date;
  postedAt?: Date | null;
  postedById?: string | null;
  items: JournalEntryItem[];
  period?: FinancialPeriod;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  status: string;
  customerId: string;
  orderId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
} 