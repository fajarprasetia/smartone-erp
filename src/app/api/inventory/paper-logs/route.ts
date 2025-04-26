import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const paperLogs = await prisma.paperLog.findMany({
      include: {
        paper_stock: {
          select: {
            qrCode: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the data to include user_name and barcode_id
    const transformedLogs = paperLogs.map(log => ({
      id: log.id,
      paper_stock_id: log.paper_stock_id,
      request_id: log.request_id,
      action: log.action,
      performed_by: log.performed_by,
      notes: log.notes,
      created_at: log.created_at,
      user_name: log.user?.name || null,
      barcode_id: log.paper_stock?.qrCode || null
    }));

    return NextResponse.json(transformedLogs, { status: 200 });
  } catch (error) {
    console.error("Error fetching paper logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch paper logs" },
      { status: 500 }
    );
  }
} 