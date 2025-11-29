import { NextResponse } from "next/server";
import twilio from "twilio";

const MASSEUR_DEFAULT = "+1XXXXXXXXXX";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Connecting you with a masseur. Please hold.");

  const dial = twiml.dial({
    timeout: 20,
    action: "/api/voice/voicemail",  // fallback
    method: "POST",
  });

  dial.number(MASSEUR_DEFAULT);

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
