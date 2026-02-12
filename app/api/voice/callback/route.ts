import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientNumber = url.searchParams.get("client")!;
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Thank you for your interest in Brazilian Blessed Cleaning. Connecting you with our team now. Please hold.");

  const dial = twiml.dial({
    timeout: 30,
    action: "/api/voice/voicemail",
    method: "POST"
  });
  dial.number(clientNumber);

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
