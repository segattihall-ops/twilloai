import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  const form = await req.formData();
  const body = (form.get("Body") || "").toString().trim().toUpperCase();
  const fromNumber = form.get("From")?.toString();

  // Only masseur can trigger command
  if (fromNumber !== process.env.MASSEUR_PHONE) {
    return new NextResponse("Ignored", { status: 200 });
  }

  if (body === "CALL") {
    // fetch last missed call
    const data = await client.sync
      .services("default")
      .maps("callback")
      .items("latest")
      .fetch();

    const clientNumber = data.data.number;

    if (!clientNumber) {
      await client.messages.create({
        to: process.env.MASSEUR_PHONE!,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: "No recent missed caller found."
      });

      return new NextResponse("OK", { status: 200 });
    }

    // call the masseur first
    await client.calls.create({
      to: process.env.MASSEUR_PHONE!,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `https://${process.env.VERCEL_URL}/api/voice/callback?client=${encodeURIComponent(clientNumber)}`
    });

    return new NextResponse("OK", { status: 200 });
  }

  return new NextResponse("OK", { status: 200 });
}
