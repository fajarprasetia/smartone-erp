import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to serialize data and handle BigInt values
const serializeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// GET /api/inventory/fabrics - Get fabric names by source ID (customer or SMARTONE)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceId = searchParams.get('source');
    
    if (!sourceId) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }
    
    // Find all inventory items for the specified source (customer ID)
    const fabrics = await prisma.inventory.findMany({
      where: {
        asal_bahan: BigInt(sourceId)
      },
      select: {
        id: true,
        nama_bahan: true,
        est_pjg_bahan: true,
        lebar_bahan: true,
        berat_bahan: true
      },
      orderBy: {
        nama_bahan: 'asc'
      }
    });
    
    // Return serialized fabric data
    return NextResponse.json(serializeData(fabrics.map(fabric => ({
      id: fabric.id,
      name: fabric.nama_bahan,
      length: fabric.est_pjg_bahan,
      width: fabric.lebar_bahan,
      weight: fabric.berat_bahan
    }))));
  } catch (error) {
    console.error('Error fetching fabrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fabrics', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}