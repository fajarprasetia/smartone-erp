import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

interface TaxFiling {
  id: string;
  type: {
    name: string;
  };
  period: string;
  amount: number;
  dueDate: Date;
  status: string;
  description: string | null;
  filingDate: Date | null;
  paymentDate: Date | null;
  referenceNumber: string | null;
}

// GET /api/finance/tax
export async function GET() {
  try {
    const taxFilings = await prisma.taxFiling.findMany({
      orderBy: {
        dueDate: "desc",
      },
    });

    return NextResponse.json(taxFilings);
  } catch (error) {
    console.error("Error fetching tax filings:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax filings" },
      { status: 500 }
    );
  }
}

// POST /api/finance/tax
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, period, amount, dueDate, notes } = body;

    if (!type || !period || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const taxFiling = await prisma.taxFiling.create({
      data: {
        type,
        period,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: "pending",
        notes,
      },
    });

    return NextResponse.json(taxFiling);
  } catch (error) {
    console.error("Error creating tax filing:", error);
    return NextResponse.json(
      { error: "Failed to create tax filing" },
      { status: 500 }
    );
  }
}