import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
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
    const template = await prisma.whatsappTemplate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
    const { description, status } = body
    
    // Get template to check if it exists
    const existingTemplate = await prisma.whatsappTemplate.findUnique({
      where: { id }
    })
    
    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (description !== undefined) {
      updateData.description = description
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
    
    // Update template
    const updatedTemplate = await prisma.whatsappTemplate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
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
    
    // Get template to access templateId
    const template = await prisma.whatsappTemplate.findUnique({
      where: { id }
    })
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    // Get WhatsApp API settings
    const settings = await prisma.appSetting.findMany({
      where: {
        key: {
          in: ["whatsapp_access_token", "whatsapp_business_account_id"]
        }
      }
    })
    
    const accessToken = settings.find(s => s.key === "whatsapp_access_token")?.value
    const businessAccountId = settings.find(s => s.key === "whatsapp_business_account_id")?.value
    
    if (!accessToken || !businessAccountId) {
      return NextResponse.json(
        { error: "WhatsApp API settings not configured" },
        { status: 400 }
      )
    }
    
    // Delete template from WhatsApp API if templateId exists
    if (template.templateId) {
      try {
        await axios.delete(
          `https://graph.facebook.com/v17.0/${template.templateId}`,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`
            }
          }
        )
      } catch (apiError: any) {
        console.error("Error deleting template from WhatsApp API:", apiError.message)
        // Continue with local deletion even if API deletion fails
      }
    }
    
    // Delete template from database
    await prisma.whatsappTemplate.delete({
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