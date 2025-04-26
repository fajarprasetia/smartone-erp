import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: any
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = session.user;
    const isAdmin = user.role.name === "System Administrator" || user.role.name === "Administrator";

    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { id } = params;

    await prisma.dashboardCard.delete({
      where: {
        id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DASHBOARD_CARD_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 