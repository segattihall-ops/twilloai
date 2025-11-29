import { NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientNumber = url.searchParams.get("client")!;
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Connecting you with the client now. Please hold.");

  const dial = twiml.dial();
  dial.number(clientNumber);

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
