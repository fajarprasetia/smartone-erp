import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReadStream, mkdirSync } from 'fs';
import { join } from 'path';
import { formidable } from 'formidable';

// Helper function to serialize data and handle BigInt values
const serializeData = (data: any): any => {
  return JSON.parse(JSON.stringify(data, (_, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '10'), 1), 100);
    const search = searchParams.get('search') || '';
    
    // Calculate skip for pagination
    
    
    // Prepare filter conditions
    const where = search ? {
      OR: [
        { nama_bahan: { contains: search, mode: 'insensitive' } },
        { keterangan: { contains: search, mode: 'insensitive' } },
        { roll: { contains: search, mode: 'insensitive' } },
        { lebar_bahan: { contains: search, mode: 'insensitive' } },
        { berat_bahan: { contains: search, mode: 'insensitive' } },
        { est_pjg_bahan: { contains: search, mode: 'insensitive' } },
        { asal_bahan_rel: { nama: { contains: search, mode: 'insensitive' } } }
      ]
    } : {};

    const skip = (page - 1) * pageSize;
    
    
    
    // Get total count for pagination
    const totalCount = await prisma.inventory.count({ where });
    
    // Fetch inventory items with pagination and search
    const inventory = await prisma.inventory.findMany({
        where,
        orderBy: { id: 'desc' },
        skip,
        take: pageSize,
        include: {
          asal_bahan_rel: true
        }
      });
      
 
    // Return empty array if no inventory items found
    if (!inventory || !Array.isArray(inventory)) {
      return NextResponse.json({
        items: [],
        pagination: {
          total: 0,
          pageCount: 0,
          page,
          pageSize
        }
      });
    }

    // Serialize and format inventory items
    const serializedInventory = serializeData(inventory);
    const enrichedInventory = serializedInventory.map((item: any) => ({
        id: item.id,
        nama_bahan: item.nama_bahan,
        lebar_bahan: item.lebar_bahan,
        berat_bahan: item.berat_bahan,
        est_pjg_bahan: item.est_pjg_bahan,
        roll: item.roll,
        tanggal: item.tanggal,
        keterangan: item.keterangan,
        foto: item.foto || null,
        asal_bahan: item.asal_bahan,
        customer_name: item.asal_bahan_rel?.nama || "N/A"
      }));     

    // Calculate pagination values
    const pageCount = Math.ceil(totalCount / pageSize);

    // Return data with pagination information
    return NextResponse.json({
      items: enrichedInventory,
      pagination: {
        total: totalCount,
        pageCount,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const uploadDir = join(process.cwd(), 'public', 'fabric');
    mkdirSync(uploadDir, { recursive: true });

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => !!mimetype?.startsWith('image/')
    });

    // Process the form data directly instead of using formidable.parse
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
        if (!fields[key]) {
          fields[key] = [];
        }
        fields[key].push(value.toString());
      }
    }

    // Extract and validate required fields
    const {
      asal_bahan,
      nama_bahan,
      lebar_bahan,
      berat_bahan,
      est_pjg_bahan,
      tanggal,
      roll,
      keterangan,
      foto
    } = Object.fromEntries(
      Object.entries(fields).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
    );
    
    if (!nama_bahan) {
      return NextResponse.json(
        { error: 'Fabric name is required' },
        { status: 400 }
      );
    }

    // Process uploaded files
    const filePaths = files.files?.map(file => `/fabric/${file.newFilename}`) || [];
    
    // Use existing foto if no new files were uploaded
    const finalFoto = filePaths.length > 0 ? filePaths[0] : (foto || null);

    // Create inventory item
    const newInventory = await prisma.inventory.create({
      data: {
        asal_bahan: asal_bahan ? BigInt(asal_bahan) : null,
        nama_bahan,
        lebar_bahan,
        berat_bahan,
        est_pjg_bahan,
        tanggal: tanggal ? new Date(tanggal) : null,
        foto: finalFoto,
        roll,
        keterangan
      },
      include: {
        asal_bahan_rel: true
      }
    });
    
    const serializedItem = serializeData(newInventory);
    
    // Format response to match the expected format
    return NextResponse.json({
      id: serializedItem.id,
      nama_bahan: serializedItem.nama_bahan,
      lebar_bahan: serializedItem.lebar_bahan,
      berat_bahan: serializedItem.berat_bahan,
      est_pjg_bahan: serializedItem.est_pjg_bahan,
      roll: serializedItem.roll,
      tanggal: serializedItem.tanggal,
      keterangan: serializedItem.keterangan,
      foto: serializedItem.foto,
      asal_bahan: serializedItem.asal_bahan,
      customer_name: serializedItem.asal_bahan_rel?.nama || "N/A"
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}