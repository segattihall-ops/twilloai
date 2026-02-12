import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // This endpoint has been deprecated
  // Use the voice system at /api/voice for Brazilian Blessed Cleaning appointments
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use the voice system for appointment scheduling." },
    { status: 410 } // 410 Gone
  );
}
