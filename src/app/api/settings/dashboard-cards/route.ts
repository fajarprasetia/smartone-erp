import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const dashboardCardSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  component: z.string().min(2),
  roleIds: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
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

    const body = await req.json();
    const validatedData = dashboardCardSchema.parse(body);

    const dashboardCard = await prisma.dashboardCard.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        component: validatedData.component,
        roles: {
          connect: validatedData.roleIds.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json(dashboardCard);
  } catch (error) {
    console.error("[DASHBOARD_CARDS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const dashboardCards = await prisma.dashboardCard.findMany({
      include: {
        roles: true,
      },
    });

    return NextResponse.json(dashboardCards);
  } catch (error) {
    console.error("[DASHBOARD_CARDS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 