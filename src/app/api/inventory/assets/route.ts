import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      assets,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      total: assets.length,
      message: "Assets retrieved successfully"
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({
      error: 'Failed to fetch assets',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Ensure required fields are present
    if (!data.name || !data.type || !data.status) {
      return NextResponse.json({
        error: 'Missing required fields',
        message: 'Name, type, and status are required'
      }, { status: 400 });
    }

    const asset = await prisma.asset.create({
      data: {
        id: data.id,
        name: data.name,
        type: data.type,
        status: data.status,
        supplier: data.supplier || null,
        location: data.location || null,
        notes: data.notes || null,
        lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice || null,
        serialNumber: data.serialNumber || null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      }
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({
      error: 'Failed to create asset',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.id) {
      return NextResponse.json({
        error: 'Missing asset ID',
        message: 'Asset ID is required for updates'
      }, { status: 400 });
    }

    const asset = await prisma.asset.update({
      where: { id: data.id },
      data: {
        name: data.name,
        type: data.type,
        status: data.status,
        supplier: data.supplier || null,
        location: data.location || null,
        notes: data.notes || null,
        lastMaintenanceDate: data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        nextMaintenanceDate: data.nextMaintenanceDate ? new Date(data.nextMaintenanceDate) : null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice || null,
        serialNumber: data.serialNumber || null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      }
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({
      error: 'Failed to update asset',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        error: 'Missing asset ID',
        message: 'Asset ID is required for deletion'
      }, { status: 400 });
    }

    await prisma.asset.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({
      error: 'Failed to delete asset',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

const formatCurrency = (value: string | undefined | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(parseFloat(value));
}; 