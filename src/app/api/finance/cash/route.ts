import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Get cash flow data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // Get main cash account
    const mainCash = await prisma.cashAccount.findFirst({
      where: { type: "MAIN" },
      include: {
        transactions: {
          where: date ? {
            date: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
            }
          } : undefined
        }
      }
    });

    // Get paid orders for the day
    const paidOrders = await prisma.order.findMany({
      where: date ? {
        OR: [
          { tgl_dp: { gte: new Date(date), lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) } },
          { tgl_lunas: { gte: new Date(date), lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)) } }
        ],
        status: "PAID"
      } : {
        status: "PAID"
      },
      select: {
        nominal: true,
        tgl_dp: true,
        tgl_lunas: true,
        keterangan: true
      }
    });

    // Calculate total income from paid orders
    const totalIncome = paidOrders.reduce((sum, order) => {
      const nominal = parseFloat(order.nominal || "0");
      return sum + (isNaN(nominal) ? 0 : nominal);
    }, 0);

    // Get payouts for the day
    const payouts = await prisma.cashTransaction.findMany({
      where: date ? {
        date: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        },
        type: "PAYOUT"
      } : {
        type: "PAYOUT"
      }
    });

    return NextResponse.json({
      mainCash,
      paidOrders,
      totalIncome,
      payouts
    });
  } catch (error) {
    console.error("Error fetching cash data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cash data" },
      { status: 500 }
    );
  }
}

// Create a new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const schema = z.object({
      type: z.enum(["INCOME", "EXPENSE", "PAYOUT"]),
      amount: z.number().min(0),
      description: z.string().min(1),
      accountId: z.string().min(1),
      date: z.string()
    });

    const validatedData = schema.parse(body);

    // Get main cash account if no accountId provided
    const accountId = validatedData.accountId || (await prisma.cashAccount.findFirst({
      where: { type: "MAIN" }
    }))?.id;

    if (!accountId) {
      return NextResponse.json(
        { error: "No valid account found" },
        { status: 400 }
      );
    }

    // Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        type: validatedData.type,
        amount: validatedData.amount,
        description: validatedData.description,
        date: new Date(validatedData.date),
        accountId: accountId,
        userId: "system" // TODO: Get from session
      }
    });

    // Update cash account balance
    const cashAccount = await prisma.cashAccount.findFirst({
      where: { type: "MAIN" }
    });

    if (cashAccount) {
      const newBalance = validatedData.type === "INCOME" 
        ? cashAccount.balance + validatedData.amount
        : cashAccount.balance - validatedData.amount;

      await prisma.cashAccount.update({
        where: { id: cashAccount.id },
        data: { balance: newBalance }
      });
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 400 }
    );
  }
}