import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: "/api/voice/menu",
    method: "POST",
  });

  gather.say(
    "Thank you for calling MasseurMatch. We're coming soon! " +
      "Press 1 to join our early access waitlist. " +
      "Press 2 to speak with our team. " +
      "Press 3 to leave a message."
  );

  twiml.say("I did not receive any input. Goodbye.");
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
