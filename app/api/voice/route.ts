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
    "Thank you for calling Knotty. " +
      "Press 1 to speak directly with a masseur. " +
      "Press 2 for booking or availability. " +
      "Press 3 for prices and general questions. " +
      "Press 4 to leave a voicemail."
  );

  twiml.say("I did not receive any input. Goodbye.");
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
