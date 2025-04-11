import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createReadStream, mkdirSync } from 'fs';
import { join } from 'path';
import { formidable } from 'formidable';
import { VisionCamera } from 'react-native-vision-camera';
import { Uploader } from 'react-uploader';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // Calculate skip for pagination
    const skip = (page - 1) * pageSize;
    
    // Get total count for pagination
    const totalCount = await prisma.inventory.count();
    
    // Fetch inventory items with pagination
    const inventory = await prisma.inventory.findMany({
      select: {
        id: true,
        asal_bahan: true,
        nama_bahan: true,
        lebar_bahan: true,
        berat_bahan: true,
        est_pjg_bahan: true,
        roll: true,
        tanggal: true,
        keterangan: true,
        foto: true
      },
      orderBy: {
        id: 'desc'
      },
      skip,
      take: pageSize
    });

    // Return empty array if no inventory items found
    if (!inventory || !Array.isArray(inventory)) {
      console.log('No inventory items found or invalid response format:', inventory);
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

    // Helper function to handle BigInt serialization
    const serializeData = (data: any) => {
      return JSON.parse(JSON.stringify(data, (key, value) => {
        // Convert BigInt to String to avoid serialization issues
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      }));
    };

    // We need to fetch associated customer names if available
    // Since we're using a direct mapping to an existing table,
    // we need to handle the customer relation manually
    
    // Get all unique customer IDs (asal_bahan)
    const customerIds = inventory
      .map(item => item.asal_bahan)
      .filter(id => id !== null && id !== '' && id !== undefined) as string[];
    
    // Create a map of customer IDs to names
    const customerMap = new Map();
    
    // Only fetch customer data if there are customer IDs
    if (customerIds.length > 0) {
      try {
        // Fetch customer data from the customer table - using parameterized query to avoid SQL injection
        const customersRaw = await prisma.$queryRaw`
          SELECT id, nama FROM customer WHERE id = ANY(ARRAY[${customerIds.join(',')}]::bigint[])
        `;
  
        // Serialize the data to handle BigInt values
        const customers = serializeData(customersRaw);
        
        if (Array.isArray(customers)) {
          customers.forEach((customer: any) => {
            customerMap.set(String(customer.id), customer.nama);
          });
        }
      } catch (customerError) {
        console.error('Error fetching customer data:', customerError);
        // Continue without customer data
      }
    }

    // Serialize inventory items to handle BigInt values
    const serializedInventory = serializeData(inventory);

    // Enrich inventory items with customer names
    const enrichedInventory = serializedInventory.map((item: any) => ({
      id: item.id,
      "Fabric Name": item.nama_bahan,
      "Width": item.lebar_bahan,
      "Weight": item.berat_bahan,
      "Est. Length": item.est_pjg_bahan,
      "Roll": item.roll,
      "Date": item.tanggal,
      "Notes": item.keterangan,
      "Capture Image": item.foto ? {
        src: item.foto,
        alt: `Fabric ${item.nama_bahan}`,
        thumbnail: true
      } : null,
      customer_name: item.asal_bahan ? customerMap.get(String(item.asal_bahan)) || 'Unknown' : 'N/A'
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
      { 
        error: 'Failed to fetch inventory', 
        details: error instanceof Error ? error.message : String(error) 
      },
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

    const [fields, files] = await form.parse(await req.formData());

    const filePaths = files.files?.map(file => 
      `/fabric/${file.newFilename}`
    ) || [];
    
    // Extract inventory item data
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
    
    // Validate required fields
    if (!nama_bahan) {
      return NextResponse.json(
        { error: 'Fabric name is required' },
        { status: 400 }
      );
    }
    
    // Create inventory item
    const newInventory = await prisma.$queryRaw`
      INSERT INTO inventory (
        asal_bahan, 
        nama_bahan, 
        lebar_bahan, 
        berat_bahan, 
        est_pjg_bahan, 
        tanggal, 
        foto, 
        roll, 
        keterangan
      ) 
      VALUES (
        ${asal_bahan || null}, 
        ${nama_bahan}, 
        ${lebar_bahan || null}, 
        ${berat_bahan || null}, 
        ${est_pjg_bahan || null}, 
        ${tanggal ? new Date(tanggal) : null}, 
        ${foto || null}, 
        ${roll || null}, 
        ${keterangan || null}
      )
      RETURNING *
    `;
    
    // Handle BigInt serialization
    const createdItem = Array.isArray(newInventory) && newInventory.length > 0 
      ? JSON.parse(JSON.stringify(newInventory[0], (key, value) => 
          typeof value === 'bigint' ? value.toString() : value
        ))
      : null;
    
    if (!createdItem) {
      return NextResponse.json(
        { error: 'Failed to create inventory item' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(createdItem, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}