import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say(
    "Our team is currently assisting other clients. Please leave your name, phone number, and the best time to reach you after the beep. We'll get back to you shortly."
  );

  twiml.record({
    maxLength: 120,
    playBeep: true,
    action: "/api/voice/voicemail-thanks",
    method: "POST",
  });

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
