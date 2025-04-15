import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString().slice(-2);
    const monthYearPrefix = `${currentMonth}${currentYear}`;

    // Find the latest SPK number for the current month only
    const latestOrder = await prisma.Order.findFirst({
      where: {
        spk: {
          startsWith: monthYearPrefix
        }
      },
      orderBy: {
        spk: 'desc'
      }
    });

    // Always start from 0001 for a new month
    let nextNumber = 1;
    
    if (latestOrder?.spk) {
      // Extract the sequence number from the latest SPK
      // The last 4 characters represent the sequence number
      const lastSequence = parseInt(latestOrder.spk.slice(-4));
      nextNumber = lastSequence + 1;
    }

    // Generate the new SPK number with format MMYY0001
    const newSpkNumber = `${monthYearPrefix}${nextNumber.toString().padStart(4, '0')}`;

    return NextResponse.json({ spkNumber: newSpkNumber });
  } catch (error: any) {
    console.error("Error generating SPK number:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
        details: String(error)
      }),
      { status: 500 }
    );
  }
}