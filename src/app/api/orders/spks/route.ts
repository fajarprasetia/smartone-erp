import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    console.log('[API] Fetching all SPK numbers');
    
    // Get all SPK numbers from orders
    const orders = await db.order.findMany({
      select: {
        spk: true,
        created_at: true,
      },
      where: {
        spk: {
          not: null,
        },
      },
      orderBy: [
        { created_at: 'desc' },
        { spk: 'desc' },
      ],
    });

    // Extract SPK numbers and filter out nulls
    const spkNumbers = orders
      .map(order => order.spk)
      .filter(spk => spk !== null && spk !== '');

    console.log(`[API] Found ${spkNumbers.length} SPK numbers`);
    
    // Log a few SPK numbers for debugging
    if (spkNumbers.length > 0) {
      console.log(`[API] Most recent SPK numbers: ${spkNumbers.slice(0, 5).join(', ')}`);
    }

    return NextResponse.json(serializeData(spkNumbers));
  } catch (error) {
    console.error('Error fetching SPK numbers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SPK numbers' },
      { status: 500 }
    );
  }
} 