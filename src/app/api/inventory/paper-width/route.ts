import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to handle serialization of data (including BigInt)
const serializeData = (data: any) => {
  return JSON.parse(
    JSON.stringify(
      data,
      (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const gsm = searchParams.get('gsm');

    if (!gsm) {
      return NextResponse.json(
        { error: 'GSM parameter is required' },
        { status: 400 }
      );
    }

    // Find paper stock with the specified GSM - using PaperStock model
    const paperStock = await prisma.paperStock.findFirst({
      where: {
        gsm: parseInt(gsm),
      },
      select: {
        width: true,
      },
    });

    if (!paperStock) {
      return NextResponse.json(
        { error: 'No paper stock found for the specified GSM' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeData({ width: paperStock.width }));
  } catch (error) {
    console.error('Error fetching paper width:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper width' },
      { status: 500 }
    );
  }
} 