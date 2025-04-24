import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Handle GET requests for webhook verification
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get verification parameters from the request
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    // Get the configured verify token from the database
    const whatsappConfig = await prisma.whatsAppConfig.findFirst();
    const configuredToken = whatsappConfig?.webhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
    
    // For development purposes, use a hardcoded token if neither is set
    const verifyToken = configuredToken || "smartone-erp-whatsapp-token";

    // Log the verification attempt for debugging
    console.log(`Webhook verification attempt - Mode: ${mode}, Token: ${token}, Expected: ${verifyToken}`);

    // Validate verification request
    if (mode === "subscribe" && token === verifyToken) {
      console.log("Webhook verified successfully");
      return new NextResponse(challenge);
    } else {
      console.error("Webhook verification failed");
      return new NextResponse("Verification failed", { status: 403 });
    }
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Handle POST requests for receiving messages and events
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Webhook event received", JSON.stringify(body, null, 2));

    // Check if this is a valid WhatsApp message event
    if (body.object === "whatsapp_business_account") {
      // Process each entry
      for (const entry of body.entry) {
        // Process each change in the entry
        for (const change of entry.changes) {
          if (change.field === "messages") {
            // Process each message
            const value = change.value;
            if (value.messages && value.messages.length > 0) {
              for (const message of value.messages) {
                await logIncomingMessage(message, value);
              }
            }

            // Process message status updates if present
            if (value.statuses && value.statuses.length > 0) {
              for (const status of value.statuses) {
                await logStatusUpdate(status);
              }
            }
          }
        }
      }
      return new NextResponse("Event received", { status: 200 });
    }

    return new NextResponse("Not a WhatsApp event", { status: 400 });
  } catch (error) {
    console.error("Error processing webhook event:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Helper function to log incoming messages
async function logIncomingMessage(message: any, value: any) {
  try {
    const phoneNumberId = value.metadata.phone_number_id;
    const from = message.from; // Sender's WhatsApp phone number
    const timestamp = new Date(parseInt(message.timestamp) * 1000);
    
    let content = "";
    let messageType = "unknown";
    let mediaUrl = "";
    
    // Determine message type and extract content
    if (message.text) {
      content = message.text.body;
      messageType = "text";
    } else if (message.image) {
      content = message.image.caption || "Image received";
      messageType = "image";
      mediaUrl = message.image.id || message.image.link || "";
    } else if (message.audio) {
      content = "Audio received";
      messageType = "audio";
      mediaUrl = message.audio.id || message.audio.link || "";
    } else if (message.video) {
      content = message.video.caption || "Video received";
      messageType = "video";
      mediaUrl = message.video.id || message.video.link || "";
    } else if (message.document) {
      content = message.document.caption || "Document received";
      messageType = "document";
      mediaUrl = message.document.id || message.document.link || "";
    } else if (message.location) {
      content = `Location received: ${message.location.latitude}, ${message.location.longitude}`;
      messageType = "location";
    }
    
    // Log for debugging
    console.log(`
      Incoming WhatsApp message:
      From: ${from}
      Type: ${messageType}
      Content: ${content}
      Time: ${timestamp.toISOString()}
      Message ID: ${message.id}
    `);
    
    // Try to find customer in lowercase 'customer' table
    let customer = null;
    try {
      // Try to find in Customer model first
      customer = await prisma.customer.findFirst({
        where: {
          telp: from,
        },
      });
    } catch (error) {
      console.log('Error finding customer in Customer model:', error);
      // Try lowercase customer model
      try {
        customer = await prisma.customer.findFirst({
          where: {
            telp: from,
          },
        });
      } catch (innerError) {
        console.error('Error finding customer in lowercase customer model:', innerError);
      }
    }

    // Since we don't have a ChatMessage table, we just log the message
    // In a real implementation, you would store this in your database
    console.log('Message received and processed successfully');
  } catch (error) {
    console.error("Error processing incoming message:", error);
  }
}

// Helper function to log status updates
async function logStatusUpdate(status: any) {
  try {
    const messageId = status.id;
    const statusType = status.status; // e.g., sent, delivered, read, failed
    const recipientId = status.recipient_id;
    const timestamp = new Date(parseInt(status.timestamp) * 1000);
    
    // Log for debugging
    console.log(`
      WhatsApp status update:
      Message ID: ${messageId}
      Status: ${statusType}
      Recipient: ${recipientId}
      Time: ${timestamp.toISOString()}
    `);
    
    // Since we don't have a ChatMessage table, we just log the status update
    // In a real implementation, you would update the message status in your database
    console.log('Status update processed successfully');
  } catch (error) {
    console.error("Error processing status update:", error);
  }
}