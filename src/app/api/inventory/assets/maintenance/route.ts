import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET maintenance records for an asset
export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/inventory/assets/maintenance - Starting request");
    
    // Debug: Log available models in prisma client
    console.log("Available models in prisma client:", Object.keys(prisma));
    
    // Get asset ID from query parameter
    const assetId = req.nextUrl.searchParams.get("assetId");
    
    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching maintenance records for asset: ${assetId}`);
    
    // Need to run a raw query since the model doesn't seem to be properly generated
    const maintenanceRecords = await prisma.$queryRaw`
      SELECT * FROM asset_maintenance_records
      WHERE "assetId" = ${assetId}
      ORDER BY date DESC
    `;
    
    console.log(`Returning ${Array.isArray(maintenanceRecords) ? maintenanceRecords.length : 0} maintenance records`);
    return NextResponse.json(maintenanceRecords);
  } catch (error) {
    console.error("Error in GET /api/inventory/assets/maintenance:", error);
    
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

// POST a new maintenance record
export async function POST(req: NextRequest) {
  console.log("POST /api/inventory/assets/maintenance - Starting request");
  
  try {
    const body = await req.json();
    console.log("Parsed maintenance data:", body);
    
    // Validate required fields
    if (!body.assetId || !body.date || !body.maintenanceType || !body.description) {
      console.error("Missing required fields:", { 
        assetId: !!body.assetId, 
        date: !!body.date, 
        maintenanceType: !!body.maintenanceType,
        description: !!body.description
      });
      
      return NextResponse.json(
        { error: "Missing required fields. All required fields must be provided.", 
          details: "assetId, date, maintenanceType, and description are required" },
        { status: 400 }
      );
    }
    
    // Format data for Prisma
    const data = {
      assetId: body.assetId,
      date: new Date(body.date),
      maintenanceType: body.maintenanceType,
      description: body.description,
      performedBy: body.performedBy || null,
      cost: body.cost ? parseFloat(body.cost) : null,
      nextMaintenanceDate: body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null,
      notes: body.notes || null,
    };
    
    // Use raw query for creating maintenance record
    const result = await prisma.$executeRaw`
      INSERT INTO asset_maintenance_records (
        id, "assetId", date, "maintenanceType", description, "performedBy", 
        cost, "nextMaintenanceDate", notes, "createdAt", "updatedAt"
      ) VALUES (
        ${crypto.randomUUID()}, ${data.assetId}, ${data.date}, ${data.maintenanceType}, 
        ${data.description}, ${data.performedBy}, ${data.cost}, 
        ${data.nextMaintenanceDate}, ${data.notes}, NOW(), NOW()
      ) RETURNING *
    `;
    
    // For updating the asset's maintenance dates, use a raw query too
    if (data.nextMaintenanceDate || data.date) {
      await prisma.$executeRaw`
        UPDATE assets
        SET "lastMaintenanceDate" = ${new Date(body.date)},
            "nextMaintenanceDate" = ${body.nextMaintenanceDate ? new Date(body.nextMaintenanceDate) : null}
        WHERE id = ${body.assetId}
      `;
    }
    
    console.log("Maintenance record created successfully");
    
    // Fetch the created record by assetId and date to return it
    const maintenanceRecords = await prisma.$queryRaw<any[]>`
      SELECT * FROM asset_maintenance_records
      WHERE "assetId" = ${data.assetId}
      ORDER BY "createdAt" DESC
      LIMIT 1
    `;
    
    return NextResponse.json(maintenanceRecords[0], { status: 201 });
  } catch (error) {
    console.error("Error processing POST request:", error);
    
    // More detailed error information
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to create maintenance record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH update a maintenance record
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Maintenance record ID is required" },
        { status: 400 }
      );
    }

    // Format date fields
    const updateData: any = {
      maintenanceType: data.maintenanceType,
      description: data.description,
      performedBy: data.performedBy,
      notes: data.notes
    };
    
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    if (data.nextMaintenanceDate) {
      updateData.nextMaintenanceDate = new Date(data.nextMaintenanceDate);
    }

    // Parse cost if provided
    if (data.cost !== undefined) {
      updateData.cost = data.cost ? parseFloat(data.cost) : null;
    }

    // Use raw query for updating
    await prisma.$executeRaw`
      UPDATE asset_maintenance_records
      SET 
        "maintenanceType" = ${updateData.maintenanceType},
        description = ${updateData.description},
        "performedBy" = ${updateData.performedBy},
        notes = ${updateData.notes},
        date = ${updateData.date || null},
        "nextMaintenanceDate" = ${updateData.nextMaintenanceDate || null},
        cost = ${updateData.cost},
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // Fetch the updated record to return it
    const maintenanceRecords = await prisma.$queryRaw<any[]>`
      SELECT * FROM asset_maintenance_records
      WHERE id = ${id}
    `;
    
    const maintenanceRecord = maintenanceRecords[0];

    // If next maintenance date is updated, update the asset as well
    if (data.nextMaintenanceDate && maintenanceRecord.assetId) {
      await prisma.$executeRaw`
        UPDATE assets
        SET "nextMaintenanceDate" = ${updateData.nextMaintenanceDate}
        WHERE id = ${maintenanceRecord.assetId}
      `;
    }

    return NextResponse.json(maintenanceRecord);
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE a maintenance record
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Maintenance record ID is required" },
        { status: 400 }
      );
    }

    // Use raw query for deleting
    await prisma.$executeRaw`
      DELETE FROM asset_maintenance_records
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance record", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 