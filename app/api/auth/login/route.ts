import { NextRequest, NextResponse } from "next/server";
import { verifyPin } from "@/lib/auth";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
  }
  const valid = await verifyPin(pin);
  if (!valid) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
