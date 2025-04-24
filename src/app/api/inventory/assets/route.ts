import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Manually define our asset schema to match database columns
interface AssetDB {
  id: string;
  name: string;
  type: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: any | null;
  warrantyExpiry?: Date | null;
  manufacturer?: string | null;
  supplier: string | null;
  location: string | null;
  status: string | null;
  lastMaintenanceDate?: Date | null;
  nextMaintenanceDate?: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// GET all assets with optional filtering and pagination
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/inventory/assets - Starting request");
    
    // Get pagination parameters from the request
    const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
    const pageSize = parseInt(req.nextUrl.searchParams.get("pageSize") || "10");
    const searchTerm = req.nextUrl.searchParams.get("search") || "";
    const typeFilter = req.nextUrl.searchParams.get("type") || "all";
    const statusFilter = req.nextUrl.searchParams.get("status") || "all";
    
    // Build WHERE clause for SQL
    let whereClause = "1=1"; // Always true condition to start
    const params: any[] = [];
    
    // Add search condition if provided
    if (searchTerm) {
      whereClause += ` AND (name ILIKE $${params.length + 1}`;
      params.push(`%${searchTerm}%`);
      
      // Check if serialNumber column exists
      const tableInfo = await prisma.$queryRaw`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Asset'
      `;
      
      const columns = Array.isArray(tableInfo) 
        ? tableInfo.map((col: any) => col.column_name.toLowerCase()) 
        : [];
      
      if (columns.includes('serialnumber')) {
        whereClause += ` OR "serialNumber" ILIKE $${params.length + 1})`;
        params.push(`%${searchTerm}%`);
      } else {
        whereClause += ")";
      }
    }
    
    // Add type filter if not "all"
    if (typeFilter !== "all") {
      whereClause += ` AND type = $${params.length + 1}`;
      params.push(typeFilter);
    }
    
    // Add status filter if not "all"
    if (statusFilter !== "all") {
      whereClause += ` AND status = $${params.length + 1}`;
      params.push(statusFilter);
    }
    
    // Count total assets with the given filters using raw query
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM "Asset" WHERE ${prisma.$raw(whereClause)}
    `;
    
    const total = parseInt(countResult[0]?.total?.toString() || "0");
    
    // Calculate pagination values
    const totalPages = Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;
    
    // Get paginated and filtered assets using raw query
    const assets = await prisma.$queryRaw`
      SELECT 
        id, name, type, 
        model, "serialNumber", "purchaseDate", 
        "purchasePrice", "warrantyExpiry", manufacturer,
        supplier, location, status,
        "lastMaintenanceDate", "nextMaintenanceDate", notes,
        "createdAt", "updatedAt"
      FROM "Asset"
      WHERE ${prisma.$raw(whereClause)}
      ORDER BY id DESC
      LIMIT ${pageSize} OFFSET ${skip}
    `;
    
    // Create response
    const response = {
      assets,
      page,
      pageSize,
      totalPages,
      total
    };
    
    console.log(`Returning ${assets.length} assets (page ${page}/${totalPages})`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/inventory/assets:", error);
    
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// POST a new asset
export async function POST(req: NextRequest) {
  console.log("POST /api/inventory/assets - Starting request");
  
  try {
    const body = await req.json();
    console.log("Parsed asset data:", body);
    
    // Validate required fields according to the form schema
    if (!body.name || !body.type || !body.status || 
        !body.purchaseDate || body.purchasePrice === undefined || 
        !body.location) {
      console.error("Missing required fields:", { 
        name: !!body.name, 
        type: !!body.type, 
        status: !!body.status,
        purchaseDate: !!body.purchaseDate,
        purchasePrice: body.purchasePrice !== undefined,
        location: !!body.location
      });
      
      return NextResponse.json(
        { error: "Missing required fields. All required fields must be provided.", 
          details: "name, type, status, purchaseDate, purchasePrice, and location are required" },
        { status: 400 }
      );
    }
    
    // Create a new asset using raw SQL
    const id = crypto.randomUUID();
    const now = new Date();
    
    // Use a raw query to insert the asset
    await prisma.$executeRaw`
      INSERT INTO "Asset" (
        id, name, type, status, 
        "serialNumber", "purchaseDate", "purchasePrice", 
        location, notes, supplier,
        model, manufacturer, "warrantyExpiry", "nextMaintenanceDate",
        "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${body.name}, ${body.type}, ${body.status},
        ${body.serialNumber || null}, ${body.purchaseDate ? new Date(body.purchaseDate) : null}, ${body.purchasePrice ? body.purchasePrice.toString() : null},
        ${body.location || null}, ${body.notes || null}, ${body.supplier || null},
        ${body.model || null}, ${body.manufacturer || null}, 
        ${body.warrantyExpiry ? new Date(body.warrantyExpiry) : null}, 
        ${body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null},
        ${now}, ${now}
      )
    `;
    
    // Fetch the created asset
    const assets = await prisma.$queryRaw`
      SELECT 
        id, name, type, 
        model, "serialNumber", "purchaseDate", 
        "purchasePrice", "warrantyExpiry", manufacturer,
        supplier, location, status,
        "lastMaintenanceDate", "nextMaintenanceDate", notes,
        "createdAt", "updatedAt"
      FROM "Asset"
      WHERE id = ${id}
    `;
    
    const asset = assets[0];
    
    console.log("Asset created successfully:", id);
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error("Error processing POST request:", error);
    
    // More detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create asset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH update an existing asset
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }
    
    // Build update SET clause
    let setClauses = [];
    
    if (data.name) setClauses.push(`name = ${data.name}`);
    if (data.type) setClauses.push(`type = ${data.type}`);
    if (data.model) setClauses.push(`model = ${data.model}`);
    if (data.serialNumber) setClauses.push(`"serialNumber" = ${data.serialNumber}`);
    if (data.location) setClauses.push(`location = ${data.location}`);
    if (data.status) setClauses.push(`status = ${data.status}`);
    if (data.notes) setClauses.push(`notes = ${data.notes}`);
    if (data.manufacturer) setClauses.push(`manufacturer = ${data.manufacturer}`);
    if (data.supplier) setClauses.push(`supplier = ${data.supplier}`);
    if (data.purchaseDate) setClauses.push(`"purchaseDate" = ${new Date(data.purchaseDate)}`);
    if (data.purchasePrice !== undefined) setClauses.push(`"purchasePrice" = ${data.purchasePrice.toString()}`);
    if (data.warrantyExpiry) setClauses.push(`"warrantyExpiry" = ${new Date(data.warrantyExpiry)}`);
    if (data.nextMaintenanceDate) setClauses.push(`"nextMaintenanceDate" = ${new Date(data.nextMaintenanceDate)}`);
    
    // Add updated timestamp
    setClauses.push(`"updatedAt" = ${new Date()}`);
    
    // Only perform update if there are changes
    if (setClauses.length > 0) {
      // Using raw query with dynamic SET clause is complex with parameterized queries
      // We'll need to use a slightly different approach
      const updateStatement = `
        UPDATE "Asset"
        SET ${setClauses.join(', ')}
        WHERE id = '${id}'
      `;
      
      await prisma.$executeRawUnsafe(updateStatement);
    }
    
    // Fetch the updated asset
    const assets = await prisma.$queryRaw`
      SELECT 
        id, name, type, 
        model, "serialNumber", "purchaseDate", 
        "purchasePrice", "warrantyExpiry", manufacturer,
        supplier, location, status,
        "lastMaintenanceDate", "nextMaintenanceDate", notes,
        "createdAt", "updatedAt"
      FROM "Asset"
      WHERE id = ${id}
    `;
    
    return NextResponse.json(assets[0]);
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE an asset
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }
    
    // Delete the asset using raw query
    await prisma.$executeRaw`
      DELETE FROM "Asset"
      WHERE id = ${id}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

const formatCurrency = (value: string | undefined | null) => {
  if (!value) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(parseFloat(value));
}; 