import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// this value comes from your .env
const MASSEUR_PHONE = process.env.MASSEUR_PHONE!;

export async function POST(req: Request) {
  const form = await req.formData();
  const fromNumber = form.get("From")?.toString();
  const callStatus = form.get("CallStatus")?.toString();

  const MISSED = ["busy", "no-answer", "failed"];

  if (fromNumber && MISSED.includes(callStatus || "")) {
    try {
      // message to CALLER
      await client.messages.create({
        to: fromNumber,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body:
          "We missed your call. A masseur will return your call soon. You can also reply here if you prefer.",
      });

      // notify masseur
      await client.messages.create({
        to: MASSEUR_PHONE,
        from: process.env.TWILIO_PHONE_NUMBER!,
        body: `Missed call from ${fromNumber}. Reply CALL to return the call.`,
      });

      // store the missed number for callback
      await client.sync
        .services("default")
        .maps("callback")
        .items("latest")
        .update({ data: { number: fromNumber } })
        .catch(async () => {
          await client.sync
            .services("default")
            .maps("callback")
            .items
            .create({ key: "latest", data: { number: fromNumber } });
        });

    } catch (err) {
      console.error("SMS error:", err);
    }
  }

  return new NextResponse("OK", { status: 200 });
}
