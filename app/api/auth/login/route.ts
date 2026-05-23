import { NextRequest, NextResponse } from "next/server";
import { verifyPin } from "@/lib/auth";
import { createSession } from "@/lib/session";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) return false;
  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { pin } = await req.json();
  if (!pin || typeof pin !== "string") {
    return NextResponse.json({ error: "PIN required" }, { status: 400 });
  }

  const valid = await verifyPin(pin);
  if (!valid) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  attempts.delete(ip);
  await createSession();
  return NextResponse.json({ ok: true });
}
