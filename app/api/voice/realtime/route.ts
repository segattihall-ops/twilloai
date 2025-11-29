import { NextResponse } from "next/server";
import twilio from "twilio";

/**
 * Twilio Media Stream connector for OpenAI Realtime API
 *
 * This route initiates a WebSocket Media Stream to connect callers
 * directly to the OpenAI Realtime API server, which uses the stored
 * prompt: pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255
 *
 * Prerequisites:
 * 1. Deploy the WebSocket server from /server directory
 * 2. Set REALTIME_WEBSOCKET_URL environment variable
 */
export async function POST(req: Request) {
  const twiml = new twilio.twiml.VoiceResponse();

  // Get WebSocket server URL from environment
  const websocketUrl = process.env.REALTIME_WEBSOCKET_URL;

  if (!websocketUrl) {
    // Fallback to chat completions if WebSocket server not configured
    console.warn('REALTIME_WEBSOCKET_URL not set, falling back to chat completions');
    twiml.say("I apologize, our real-time assistant is not available. Let me redirect you to our standard assistant.");
    twiml.redirect("/api/voice/ai-assistant");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }

  try {
    // Start Media Stream to WebSocket server
    const connect = twiml.connect();
    connect.stream({
      url: websocketUrl,
    });

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error('Error starting Media Stream:', error);

    // Fallback on error
    twiml.say("I'm having trouble connecting to our assistant. Please try again later.");
    twiml.hangup();

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
