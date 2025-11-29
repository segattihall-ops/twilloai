import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: Request) {
  const form = await req.formData();
  const digit = form.get("Digits")?.toString();
  const twiml = new twilio.twiml.VoiceResponse();

  switch (digit) {
    case "1":
      twiml.redirect("/api/voice/transfer");
      break;

    case "2":
      twiml.say("For booking or availability, please visit our website or send us a text message.");
      twiml.say("If you'd like to speak with a masseur, press 1.");
      break;

    case "3":
      twiml.say("Our prices start at your predefined rate. For detailed pricing, please visit our website.");
      twiml.say("Press 1 to speak directly with a masseur.");
      break;

    case "4":
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
