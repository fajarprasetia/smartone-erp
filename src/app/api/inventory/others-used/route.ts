import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const searchQuery = searchParams.get("query") || "";
    
    // Build query to fetch items that are not available
    const whereClause: any = {
      availability: false,
    };
    
    if (category) {
      whereClause.category = category;
    }
    
    if (searchQuery) {
      whereClause.OR = [
        { item_name: { contains: searchQuery, mode: "insensitive" } },
        { category: { contains: searchQuery, mode: "insensitive" } },
        { qr_code: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ];
    }
    
    const items = await prisma.othersItem.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        taken_by_user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
    
    const count = await prisma.othersItem.count({
      where: whereClause,
    });
    
    return NextResponse.json({
      items: items.map((item: any) => ({
        id: item.id,
        qr_code: item.qr_code,
        category: item.category,
        item_name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        notes: item.notes,
        availability: item.availability,
        user_id: item.user_id,
        taken_by_user_id: item.taken_by_user_id,
        created_at: item.created_at,
        used_at: item.taken_at,
        user: {
          name: item.user?.name,
        },
        taken_by_user: item.taken_by_user ? {
          name: item.taken_by_user.name,
        } : null,
      })),
      count,
    });
  } catch (error) {
    console.error("Error fetching used others items:", error);
    return NextResponse.json(
      { error: "Failed to fetch used items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized access" },
      { status: 401 }
    );
  }
  
  try {
    const data = await request.json();
    const { item_id, notes } = data;
    
    if (!item_id) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }
    
    // Check if the item exists and is available
    const existingItem = await prisma.othersItem.findUnique({
      where: {
        id: item_id,
      },
    });
    
    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }
    
    if (existingItem.availability === false) {
      return NextResponse.json(
        { error: "Item is already marked as used" },
        { status: 400 }
      );
    }
    
    // Update the item to mark it as used
    const updatedItem = await prisma.othersItem.update({
      where: {
        id: item_id,
      },
      data: {
        availability: false,
        taken_at: new Date(),
        taken_by_user_id: session.user.id,
        notes: notes || "Marked as used",
      },
    });
    
    // Log the action
    await prisma.othersLog.create({
      data: {
        action: "USED",
        others_item_id: item_id,
        user_id: session.user.id,
        notes: notes || "Item marked as used",
      },
    });
    
    return NextResponse.json({
      message: "Item marked as used successfully",
      item: {
        id: updatedItem.id,
        qrCode: updatedItem.qr_code,
        name: updatedItem.item_name,
        category: updatedItem.category,
        quantity: updatedItem.quantity,
        unit: updatedItem.unit,
        description: updatedItem.description,
        dateTaken: updatedItem.taken_at,
        takenBy: {
          id: session.user.id,
          name: session.user.name,
        },
        notes: updatedItem.notes,
        created_at: updatedItem.created_at,
      },
    });
  } catch (error) {
    console.error("Error marking item as used:", error);
    return NextResponse.json(
      { error: "Failed to mark item as used" },
      { status: 500 }
    );
  }
} 