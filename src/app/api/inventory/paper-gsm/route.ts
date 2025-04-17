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
    // Get all unique GSM values from paper stocks - using PaperStock model
    const paperStocks = await prisma.paperStock.findMany({
      select: {
        gsm: true,
      },
      distinct: ['gsm'],
      orderBy: {
        gsm: 'asc',
      },
    });

    // Extract and format GSM values
    const gsmValues = paperStocks.map(paper => paper.gsm);

    return NextResponse.json(serializeData(gsmValues));
  } catch (error) {
    console.error('Error fetching paper GSMs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper GSMs' },
      { status: 500 }
    );
  }
} 