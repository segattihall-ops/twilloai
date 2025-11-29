import { NextResponse } from "next/server";
import twilio from "twilio";
import OpenAI from "openai";

export async function POST(req: Request) {
  // Initialize OpenAI client inside the function
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });
  const form = await req.formData();
  const speechResult = form.get("SpeechResult")?.toString() || "";
  const callSid = form.get("CallSid")?.toString();

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    // Get AI response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a friendly massage therapy assistant for Knotty.
          Help customers with:
          - Booking appointments
          - Answering questions about services and pricing
          - Providing information about massage types
          - Connecting them with a masseur if needed

          Keep responses brief and conversational (2-3 sentences max).
          If they want to book or speak to someone, offer to transfer them to a masseur.`
        },
        {
          role: "user",
          content: speechResult
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content ||
      "I'm sorry, I didn't catch that. Could you repeat?";

    // Check if user wants to speak with someone
    const wantsTransfer = speechResult.toLowerCase().includes("speak") ||
      speechResult.toLowerCase().includes("talk") ||
      speechResult.toLowerCase().includes("masseur") ||
      speechResult.toLowerCase().includes("person");

    if (wantsTransfer) {
      twiml.say(aiResponse);
      twiml.say("Let me transfer you to a masseur now.");
      twiml.redirect("/api/voice/transfer");
    } else {
      // Continue conversation
      twiml.say(aiResponse);

      const gather = twiml.gather({
        input: ["speech"],
        action: "/api/voice/ai-assistant",
        method: "POST",
        speechTimeout: "auto",
        speechModel: "phone_call",
      });

      gather.say("How else can I help you today?");

      // Fallback if no input
      twiml.say("I didn't hear anything. If you'd like to speak with a masseur, press 1 or say transfer.");
      twiml.redirect("/api/voice/menu");
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("OpenAI Error:", error);

    // Fallback to human on error
    twiml.say("I'm having trouble understanding. Let me connect you with a masseur.");
    twiml.redirect("/api/voice/transfer");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
