import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say("Thank you for contacting Brazilian Blessed Cleaning. We appreciate your call and will reach out to you shortly. Have a wonderful day!");
  twiml.hangup();

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
