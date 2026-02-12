import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const form = await req.formData();
  const digit = form.get("Digits")?.toString();
  const twiml = new twilio.twiml.VoiceResponse();

  switch (digit) {
    case "1":
      // AI Assistant - Schedule cleaning estimate
      twiml.redirect("/api/voice/realtime");
      break;

    case "2":
      // Transfer to team member
      twiml.redirect("/api/voice/transfer");
      break;

    case "3":
      // Voicemail
      twiml.redirect("/api/voice/voicemail");
      break;

    default:
      twiml.say("Invalid entry. Please call back and select a valid option. Goodbye.");
      twiml.hangup();
  }

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
