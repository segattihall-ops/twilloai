import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say(
    "The masseur is currently unavailable. Please leave your name, number, and message after the beep."
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
