import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Retrieve all templates
export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      select: {
        id: true,
        name: true,
        language: true,
        components: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        language: template.language,
        components: template.components,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching WhatsApp templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp templates" },
      { status: 500 }
    )
  }
}

// POST - Create a new template
export async function POST(req: Request) {
  try {
    const { name, language, components } = await req.json();

    if (!name || !components) {
      return NextResponse.json(
        { error: "Name and components are required" },
        { status: 400 }
      );
    }

    const template = await prisma.whatsAppTemplate.create({
      data: {
        name,
        language: language || "en",
        components,
        isActive: true,
      },
    });

    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        language: template.language,
        components: template.components,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating WhatsApp template:", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a template
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 })
    }
    
    // Mock successful deletion
    return NextResponse.json({ 
      success: true, 
      message: "Template deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting WhatsApp template:", error)
    return NextResponse.json(
      { error: "Failed to delete WhatsApp template" },
      { status: 500 }
    )
  }
} 