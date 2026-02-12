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

  if (fromNumber !== process.env.BRAZILIAN_BLESSED_TEAM_NUMBER) {
    return new NextResponse("Ignored", { status: 200 });
  }

  if (body === "CALL") {
    // Cast sync to any to avoid TS error with Twilio v3
    const mapItem = await (client.sync as any)
      .services("default")
      .maps("callback")
      .items("latest")
      .fetch();

    const clientNumber = mapItem.data.number;

    await client.calls.create({
      to: process.env.BRAZILIAN_BLESSED_TEAM_NUMBER!,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `https://${process.env.VERCEL_URL}/api/voice/callback?client=${encodeURIComponent(
        clientNumber
      )}`,
    });
  }

  return new NextResponse("OK", { status: 200 });
}
