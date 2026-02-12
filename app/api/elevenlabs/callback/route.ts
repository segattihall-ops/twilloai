import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

interface ZapierWebhookData {
  decision?: string;
  caller_phone: string;
  caller_location?: string;
  call_duration?: string;
  ai_output?: string;
  call_status?: string;
  timestamp?: string;
}

export async function POST(req: Request) {
  try {
    const data: ZapierWebhookData = await req.json();

    console.log("📨 Received Zapier webhook:", {
      phone: data.caller_phone,
      decision: data.decision,
      location: data.caller_location,
      timestamp: data.timestamp,
    });

    // Process the decision
    const processedData = {
      caller_phone: data.caller_phone,
      caller_location: data.caller_location || "Unknown",
      call_duration: data.call_duration || "0",
      decision: data.decision || "unknown",
      call_status: data.call_status || "completed",
      timestamp: data.timestamp || new Date().toISOString(),
      ai_output: data.ai_output || "",
      processed_at: new Date().toISOString(),
    };

    // Validate required fields
    if (!processedData.caller_phone) {
      return NextResponse.json(
        { error: "Missing caller_phone" },
        { status: 400 }
      );
    }

    // Extract client information first
    const clientInfo = {
      phone: processedData.caller_phone,
      location: processedData.caller_location,
    };

    // Call ElevenLabs Conversational AI based on decision
    let elevenLabsResponse = null;
    let decisionAction: any = null;

    if (processedData.decision === "email") {
      // Decision: Email follow-up
      const emailPrompt = `
        A customer from ${processedData.caller_location} has requested an email follow-up.
        Call duration: ${processedData.call_duration} seconds
        Phone: ${processedData.caller_phone}
        
        Prepare a professional email response acknowledging their interest in Brazilian Blessed Cleaning services.
        Include next steps and create a sense of urgency.
      `;

      elevenLabsResponse = await callElevenLabsConversationalAI(emailPrompt);
      decisionAction = { type: "email_followup", status: "sent" };
    } else if (processedData.decision === "calendar") {
      // Decision: Calendar booking
      const calendarPrompt = `
        A customer from ${processedData.caller_location} wants to book an appointment.
        Call duration: ${processedData.call_duration} seconds
        Phone: ${processedData.caller_phone}
        
        Generate a calendar invitation summary for scheduling a cleaning estimate.
        Include available time slots and confirmation details.
      `;

      elevenLabsResponse = await callElevenLabsConversationalAI(calendarPrompt);
      decisionAction = {
        type: "calendar_booking",
        title: "Brazilian Blessed Cleaning Estimate",
        location: processedData.caller_location,
      };
    } else {
      // Default: General follow-up for no decision made
      const defaultPrompt = `
        A customer from ${processedData.caller_location} completed a call.
        Call duration: ${processedData.call_duration} seconds
        Phone: ${processedData.caller_phone}
        
        Generate a follow-up message thanking them for their interest in Brazilian Blessed Cleaning.
      `;

      elevenLabsResponse = await callElevenLabsConversationalAI(defaultPrompt);
      decisionAction = {
        type: "default_followup",
        message: "Thank you for your interest. Our team will follow up shortly.",
      };
    }

    // Log analytics
    console.log("📊 Decision Analytics:", {
      decision_type: processedData.decision,
      caller_phone: clientInfo.phone,
      caller_location: clientInfo.location,
      call_duration_seconds: processedData.call_duration,
      timestamp: processedData.timestamp,
      processed_at: new Date().toISOString(),
    });

    // Send internal notification
    console.log("📬 Internal notification:", {
      decision: processedData.decision,
      caller_phone: clientInfo.phone,
      location: clientInfo.location,
      action: `${processedData.decision === "email" ? "Send email follow-up" : "Calendar booking"} for caller`,
    });

    // Build response
    const response = {
      success: true,
      message: "Webhook processed successfully",
      data: {
        caller_phone: processedData.caller_phone,
        decision: processedData.decision,
        location: processedData.caller_location,
        call_duration: processedData.call_duration,
        status: processedData.call_status,
        client_info: clientInfo,
        action: decisionAction,
        elevenlabs_response: elevenLabsResponse,
        processed_at: processedData.processed_at,
      },
    };

    console.log("✅ Webhook processed successfully");

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Call ElevenLabs Conversational AI API
 */
async function callElevenLabsConversationalAI(
  prompt: string
): Promise<string | null> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.warn("⚠️  ELEVENLABS_API_KEY not configured");
      return null;
    }

    const client = new ElevenLabsClient({ apiKey });

    // Use ElevenLabs Conversational AI
    // Note: This is a simplified example - adapt based on ElevenLabs' actual API
    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/conversation",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: process.env.ELEVENLABS_AGENT_ID || "default",
          user_message: prompt,
          conversation_id: `conv_${Date.now()}`,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "ElevenLabs API error:",
        response.status,
        response.statusText
      );
      return null;
    }

    const result = await response.json();
    return result.agent_response || result.response || null;
  } catch (error) {
    console.error("Error calling ElevenLabs:", error);
    return null;
  }
}

/**
 * Handle GET requests - returns endpoint info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/elevenlabs/callback",
    method: "POST",
    description:
      "Receives Zapier webhook data and processes with ElevenLabs Conversational AI",
    expected_payload: {
      decision: "email or calendar",
      caller_phone: "+1234567890",
      caller_location: "MINNEAPOLIS, MN",
      call_duration: "123",
      ai_output: "{...full AI output...}",
      call_status: "completed",
      timestamp: "Thu, 01 Feb 2018 20:00:29 +0000",
    },
  });
}
