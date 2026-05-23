import { NextRequest, NextResponse } from "next/server";
import { isPinSetup, setupPin } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  if (await isPinSetup()) {
    return NextResponse.json({ error: "Already set up" }, { status: 409 });
  }
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string" || !/^\d{4,8}$/.test(pin)) {
    return NextResponse.json({ error: "PIN must be 4–8 digits" }, { status: 400 });
  }
  await setupPin(pin);
  await createSession();
  return NextResponse.json({ ok: true });
}
