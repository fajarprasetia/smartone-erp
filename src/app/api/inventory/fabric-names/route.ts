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
    const asalBahan = searchParams.get('asal_bahan');

    if (!asalBahan) {
      return NextResponse.json(
        { error: 'Source ID (asal_bahan) parameter is required' },
        { status: 400 }
      );
    }

    // Find fabrics with the specified source ID - using inventory table
    const fabrics = await prisma.inventory.findMany({
      where: {
        asal_bahan: parseInt(asalBahan),
      },
      select: {
        id: true,
        nama_bahan: true,
        lebar_bahan: true,
        berat_bahan: true,
        est_pjg_bahan: true,
        keterangan: true,
      },
      orderBy: {
        nama_bahan: 'asc',
      },
    });

    // Format fabrics to match FabricInfo interface
    const formattedFabrics = fabrics.map(fabric => ({
      id: fabric.id.toString(),
      name: fabric.nama_bahan || '',
      description: fabric.keterangan || '',
      weight: fabric.berat_bahan || '',
      width: fabric.lebar_bahan || '',
      length: fabric.est_pjg_bahan || '',
    }));

    return NextResponse.json(serializeData(formattedFabrics));
  } catch (error) {
    console.error('Error fetching fabric names:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fabric names' },
      { status: 500 }
    );
  }
} 