import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const form = await req.formData();
  const digit = form.get("Digits")?.toString();
  const twiml = new twilio.twiml.VoiceResponse();

  switch (digit) {
    case "1":
      // AI Assistant
      twiml.say("Welcome to our AI assistant. I'm here to help answer your questions.");
      const gather = twiml.gather({
        input: ["speech"],
        action: "/api/voice/ai-assistant",
        method: "POST",
        speechTimeout: "auto",
        speechModel: "phone_call",
      });
      gather.say("How can I help you today?");
      break;

    case "2":
      // Transfer to masseur
      twiml.redirect("/api/voice/transfer");
      break;

    case "3":
      // Booking/availability
      twiml.say("For booking or availability, please visit our website or send us a text message.");
      twiml.say("If you'd like to speak with our AI assistant, press 1. To speak with a masseur, press 2.");
      break;

    case "4":
      // Prices
      twiml.say("Our prices start at your predefined rate. For detailed pricing, please visit our website.");
      twiml.say("Press 1 for our AI assistant or press 2 to speak directly with a masseur.");
      break;

    case "5":
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
