import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "nexus_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET env var is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function makeToken(): string {
  const exp = Date.now() + SESSION_DURATION_MS;
  const payload = `${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  const exp = parseInt(payload, 10);
  return Date.now() < exp;
}

export async function createSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}
