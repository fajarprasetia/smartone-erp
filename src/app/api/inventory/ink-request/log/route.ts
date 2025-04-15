import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      activity_type,
      ink_stock_id,
      ink_request_id,
      notes
    } = await req.json();

    if (!activity_type) {
      return NextResponse.json(
        { error: "Activity type is required" },
        { status: 400 }
      );
    }

    // Create a log entry
    const logEntry = await db.inkLog.create({
      data: {
        action: activity_type,
        ink_stock_id,
        request_id: ink_request_id,
        performed_by: session.user.id,
        notes,
        created_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Activity logged successfully",
      logEntry
    });
  } catch (error) {
    console.error("Error logging ink activity:", error);
    return NextResponse.json(
      { error: "Failed to log activity" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeUser = searchParams.get("include_user") === "true";
    
    // Fetch ink activity logs
    const logs = await db.inkLog.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: includeUser ? {
          select: {
            id: true,
            name: true
          }
        } : false
      }
    });
    
    // Transform data for response
    const transformedLogs = logs.map(log => ({
      id: log.id,
      activity_type: log.action,
      ink_stock_id: log.ink_stock_id,
      ink_request_id: log.request_id,
      user_id: log.performed_by,
      user_name: includeUser ? log.user.name : undefined,
      action_details: log.action,
      notes: log.notes,
      timestamp: log.created_at.toISOString()
    }));
    
    return NextResponse.json(transformedLogs);
  } catch (error) {
    console.error("Error fetching ink activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
} 