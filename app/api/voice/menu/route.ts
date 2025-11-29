import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const form = await req.formData();
  const digit = form.get("Digits")?.toString();
  const twiml = new twilio.twiml.VoiceResponse();

  switch (digit) {
    case "1":
      // AI Waitlist Assistant
      twiml.say("Welcome! MasseurMatch is launching soon, and I'd love to add you to our early access waitlist.");
      const gather = twiml.gather({
        input: ["speech"],
        action: "/api/voice/ai-assistant",
        method: "POST",
        speechTimeout: "auto",
        speechModel: "phone_call",
      });
      gather.say("To get started, may I have your full name?");
      break;

    case "2":
      // Transfer to masseur
      twiml.redirect("/api/voice/transfer");
      break;

    case "3":
      // Voicemail
      twiml.redirect("/api/voice/voicemail");
      break;

    default:
      twiml.say("Invalid entry. Goodbye.");
      twiml.hangup();
  }

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
