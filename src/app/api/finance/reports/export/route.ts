import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = new Date(searchParams.get("from") || "");
    const to = new Date(searchParams.get("to") || "");

    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SmartOne ERP";
    workbook.created = new Date();

    // Cash Flow Sheet
    const cashFlowSheet = workbook.addWorksheet("Cash Flow");
    cashFlowSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Description", key: "description", width: 40 },
      { header: "Amount", key: "amount", width: 15 },
    ];

    const cashTransactions = await prisma.cashTransaction.findMany({
      where: {
        date: {
          gte: from,
          lte: to,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    cashTransactions.forEach((transaction) => {
      cashFlowSheet.addRow({
        date: format(transaction.date, "yyyy-MM-dd"),
        type: transaction.type,
        description: transaction.description,
        amount: transaction.amount,
      });
    });

    // Accounts Receivable Sheet
    const arSheet = workbook.addWorksheet("Accounts Receivable");
    arSheet.columns = [
      { header: "Invoice Number", key: "invoiceNumber", width: 15 },
      { header: "Customer", key: "customer", width: 30 },
      { header: "Issue Date", key: "issueDate", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Balance", key: "balance", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        invoiceDate: "asc",
      },
    });

    invoices.forEach((invoice) => {
      arSheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        customer: invoice.customer.nama,
        issueDate: format(invoice.invoiceDate, "yyyy-MM-dd"),
        dueDate: format(invoice.dueDate, "yyyy-MM-dd"),
        amount: invoice.total,
        balance: invoice.balance,
        status: invoice.status,
      });
    });

    // Accounts Payable Sheet
    const apSheet = workbook.addWorksheet("Accounts Payable");
    apSheet.columns = [
      { header: "Bill Number", key: "billNumber", width: 15 },
      { header: "Vendor", key: "vendor", width: 30 },
      { header: "Issue Date", key: "issueDate", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Paid Amount", key: "paidAmount", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    const bills = await prisma.bill.findMany({
      where: {
        issueDate: {
          gte: from,
          lte: to,
        },
      },
      include: {
        vendor: true,
      },
      orderBy: {
        issueDate: "asc",
      },
    });

    bills.forEach((bill) => {
      apSheet.addRow({
        billNumber: bill.billNumber,
        vendor: bill.vendor.name,
        issueDate: format(bill.issueDate, "yyyy-MM-dd"),
        dueDate: format(bill.dueDate, "yyyy-MM-dd"),
        amount: bill.totalAmount,
        paidAmount: bill.paidAmount,
        status: bill.status,
      });
    });

    // Tax Filings Sheet
    const taxSheet = workbook.addWorksheet("Tax Filings");
    taxSheet.columns = [
      { header: "Tax Type", key: "type", width: 20 },
      { header: "Period", key: "period", width: 15 },
      { header: "Due Date", key: "dueDate", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Notes", key: "notes", width: 40 },
    ];

    const taxFilings = await prisma.taxFiling.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to,
        },
      },
      include: {
        type: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    taxFilings.forEach((filing) => {
      taxSheet.addRow({
        type: filing.type.name,
        period: filing.period,
        dueDate: format(filing.dueDate, "yyyy-MM-dd"),
        amount: filing.amount,
        status: filing.status,
        notes: filing.notes,
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return the Excel file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=financial-report-${format(from, "yyyy-MM-dd")}-to-${format(to, "yyyy-MM-dd")}.xlsx`,
      },
    });
  } catch (error) {
    console.error("Error exporting financial report:", error);
    return NextResponse.json(
      { error: "Failed to export financial report" },
      { status: 500 }
    );
  }
} 