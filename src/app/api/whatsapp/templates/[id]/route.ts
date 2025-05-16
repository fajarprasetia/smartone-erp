import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import axios from "axios"

// GET a specific template by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const id = params.id
    
    // Get template
    const template = await prisma.whatsAppTemplate.findUnique({
      where: { id },
    })
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    return NextResponse.json({ template })
  } catch (error: any) {
    console.error("Error fetching WhatsApp template:", error)
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp template", message: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update a template
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = params.id
    const body = await request.json()
    const { name, language, category, status, parameters } = body
    
    // Get template to check if it exists
    const existingTemplate = await prisma.whatsAppTemplate.findUnique({
      where: { id }
    })
    
    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) {
      updateData.name = name
    }
    
    if (language !== undefined) {
      updateData.language = language
    }
    
    if (category !== undefined) {
      updateData.category = category
    }
    
    if (status !== undefined) {
      // Validate status
      const validStatuses = ["PENDING", "APPROVED", "REJECTED"]
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value. Must be one of: PENDING, APPROVED, REJECTED" },
          { status: 400 }
        )
      }
      updateData.status = status
    }
    
    if (parameters !== undefined) {
      updateData.metadata = {
        parameters: parameters,
      }
    }
    
    // Update template
    const updatedTemplate = await prisma.whatsAppTemplate.update({
      where: { id },
      data: updateData,
    })
    
    return NextResponse.json({ 
      success: true, 
      template: updatedTemplate 
    })
  } catch (error: any) {
    console.error("Error updating WhatsApp template:", error)
    return NextResponse.json(
      { error: "Failed to update WhatsApp template", message: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = params.id
    
    // Get WhatsApp API settings
    const settings = await prisma.whatsAppConfig.findFirst();
    
    if (!settings) {
      return NextResponse.json(
        { error: "WhatsApp settings not configured" },
        { status: 400 }
      );
    }
    
    const accessToken = settings.accessToken;
    const businessAccountId = settings.businessAccountId;
    
    if (!accessToken || !businessAccountId) {
      return NextResponse.json(
        { error: "Missing WhatsApp configuration: accessToken or businessAccountId" },
        { status: 400 }
      );
    }
    
    // Delete template from database
    await prisma.whatsAppTemplate.delete({
      where: { id }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: "Template deleted successfully" 
    })
  } catch (error: any) {
    console.error("Error deleting WhatsApp template:", error)
    return NextResponse.json(
      { error: "Failed to delete WhatsApp template", message: error.message },
      { status: 500 }
    )
  }
} 