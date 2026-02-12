import { NextResponse } from "next/server";
import twilio from "twilio";

const TEAM_DEFAULT = process.env.BRAZILIAN_BLESSED_TEAM_NUMBER || "+1XXXXXXXXXX";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Thank you for calling Brazilian Blessed Cleaning. Connecting you with our team now. Please hold.");

  const dial = twiml.dial({
    timeout: 30,
    action: "/api/voice/voicemail",
    method: "POST",
  });

  dial.number(TEAM_DEFAULT);

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
