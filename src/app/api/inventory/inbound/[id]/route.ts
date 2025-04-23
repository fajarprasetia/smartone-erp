import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { join } from 'path';
import { mkdirSync } from 'fs';

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
    
    // Handle form data for file uploads
    const uploadDir = join(process.cwd(), 'public', 'fabric');
    mkdirSync(uploadDir, { recursive: true });
    
    const formData = await req.formData();
    
    // Extract fields from formData
    const fields: Record<string, any> = {};
    const files: Record<string, any> = { files: [] };
    
    // Process each entry in the formData
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file uploads
        const buffer = Buffer.from(await value.arrayBuffer());
        const filename = `${Date.now()}-${value.name}`;
        const filepath = join(uploadDir, filename);
        
        // Write file to disk
        const fs = require('fs');
        fs.writeFileSync(filepath, buffer);
        
        // Add file info to files array
        files.files.push({
          newFilename: filename,
          filepath,
          originalFilename: value.name,
          mimetype: value.type,
          size: value.size
        });
      } else {
        // Handle form fields
        fields[key] = value.toString();
      }
    }
    
    // Extract data from fields
    const {
      asal_bahan,
      nama_bahan,
      lebar_bahan,
      berat_bahan,
      est_pjg_bahan,
      tanggal,
      foto,
      roll,
      keterangan
    } = fields;
    
    // Process uploaded files
    const filePaths = files.files?.map((file: any) => `/fabric/${file.newFilename}`) || [];
    
    // Use existing foto if no new files were uploaded
    const finalFoto = filePaths.length > 0 ? filePaths[0] : (foto || null);

    const updatedInventory = await prisma.inventory.update({
      where: { id: BigInt(id) },
      data: {
        nama_bahan: nama_bahan || undefined,
        lebar_bahan: lebar_bahan || undefined,
        berat_bahan: berat_bahan || undefined,
        est_pjg_bahan: est_pjg_bahan || undefined,
        tanggal: tanggal ? new Date(tanggal) : undefined,
        foto: finalFoto,
        roll: roll || undefined,
        keterangan: keterangan || undefined,
        asal_bahan: asal_bahan ? BigInt(asal_bahan) : null
      },
      include: {
        asal_bahan_rel: true
      }
    });

    const serializedInventory = serializeData(updatedInventory);

    // Return in the same format as GET endpoint
    return NextResponse.json({
      id: serializedInventory.id,
      nama_bahan: serializedInventory.nama_bahan,
      lebar_bahan: serializedInventory.lebar_bahan,
      berat_bahan: serializedInventory.berat_bahan,
      est_pjg_bahan: serializedInventory.est_pjg_bahan,
      roll: serializedInventory.roll,
      tanggal: serializedInventory.tanggal,
      keterangan: serializedInventory.keterangan,
      foto: serializedInventory.foto,
      asal_bahan: serializedInventory.asal_bahan,
      customer_name: serializedInventory.asal_bahan_rel?.nama || "N/A"
    });
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