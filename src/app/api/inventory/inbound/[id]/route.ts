import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to serialize data and handle BigInt values
const serializeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
};

// GET single inventory item
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const inventory = await prisma.inventory.findUnique({
      where: { id: BigInt(id) },
      include: {
        asal_bahan_rel: true
      }
    });

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const serializedInventory = serializeData(inventory);

    const formattedInventory = {
      id: serializedInventory.id,
      "Fabric Name": serializedInventory.nama_bahan,
      "Width": serializedInventory.lebar_bahan,
      "Weight": serializedInventory.berat_bahan,
      "Est. Length": serializedInventory.est_pjg_bahan,
      "Roll": serializedInventory.roll,
      "Date": serializedInventory.tanggal,
      "Notes": serializedInventory.keterangan,
      "Capture Image": serializedInventory.foto ? {
        src: serializedInventory.foto,
        alt: `Fabric ${serializedInventory.nama_bahan}`,
        thumbnail: true
      } : null,
      "Source/Customer": serializedInventory.asal_bahan_rel?.nama || 'N/A'
    };

    return NextResponse.json(formattedInventory);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT update inventory item
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const data = await req.json();

    // Convert customer ID to BigInt if provided
    const asal_bahan = data.asal_bahan ? BigInt(data.asal_bahan) : null;

    const updatedInventory = await prisma.inventory.update({
      where: { id: BigInt(id) },
      data: {
        nama_bahan: data.nama_bahan,
        lebar_bahan: data.lebar_bahan,
        berat_bahan: data.berat_bahan,
        est_pjg_bahan: data.est_pjg_bahan,
        tanggal: data.tanggal ? new Date(data.tanggal) : null,
        foto: data.foto,
        roll: data.roll,
        keterangan: data.keterangan,
        asal_bahan: asal_bahan
      },
      include: {
        asal_bahan_rel: true
      }
    });

    const serializedInventory = serializeData(updatedInventory);

    const formattedInventory = {
      id: serializedInventory.id,
      "Fabric Name": serializedInventory.nama_bahan,
      "Width": serializedInventory.lebar_bahan,
      "Weight": serializedInventory.berat_bahan,
      "Est. Length": serializedInventory.est_pjg_bahan,
      "Roll": serializedInventory.roll,
      "Date": serializedInventory.tanggal,
      "Notes": serializedInventory.keterangan,
      "Capture Image": serializedInventory.foto ? {
        src: serializedInventory.foto,
        alt: `Fabric ${serializedInventory.nama_bahan}`,
        thumbnail: true
      } : null,
      "Source/Customer": serializedInventory.asal_bahan_rel?.nama || 'N/A'
    };

    return NextResponse.json(formattedInventory);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE inventory item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    await prisma.inventory.delete({
      where: { id: BigInt(id) }
    });

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}