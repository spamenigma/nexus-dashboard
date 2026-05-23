import { createHash, scryptSync, timingSafeEqual, randomBytes } from "crypto";
import { db } from "./db";

const PIN_KEY = "auth.pinHash";
const SETUP_DONE_KEY = "auth.setupDone";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_SALT_LEN = 16;
const SCRYPT_KEY_LEN = 64;

export function hashPin(pin: string): string {
  const salt = randomBytes(SCRYPT_SALT_LEN);
  const hash = scryptSync(pin, salt, SCRYPT_KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return `$scrypt$${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPinHash(pin: string, stored: string): boolean {
  if (stored.startsWith("$scrypt$")) {
    const rest = stored.slice("$scrypt$".length);
    const colonIdx = rest.indexOf(":");
    if (colonIdx === -1) return false;
    const salt = Buffer.from(rest.slice(0, colonIdx), "hex");
    const expected = Buffer.from(rest.slice(colonIdx + 1), "hex");
    const derived = scryptSync(pin, salt, SCRYPT_KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  }
  // Legacy SHA-256 format — migrate on next login via setupPin
  const legacy = createHash("sha256").update(`nexus:${pin}`).digest("hex");
  const storedBuf = Buffer.from(stored, "hex");
  const legacyBuf = Buffer.from(legacy, "hex");
  if (storedBuf.length !== legacyBuf.length) return false;
  return timingSafeEqual(storedBuf, legacyBuf);
}

export async function isPinSetup(): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: SETUP_DONE_KEY } });
  return row?.value === "true";
}

export async function setupPin(pin: string): Promise<void> {
  const hash = hashPin(pin);
  await db.setting.upsert({
    where: { key: PIN_KEY },
    create: { key: PIN_KEY, value: hash },
    update: { value: hash },
  });
  await db.setting.upsert({
    where: { key: SETUP_DONE_KEY },
    create: { key: SETUP_DONE_KEY, value: "true" },
    update: { value: "true" },
  });
}

export async function verifyPin(pin: string): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: PIN_KEY } });
  if (!row) return false;
  const valid = verifyPinHash(pin, row.value);
  // Migrate legacy SHA-256 hash to scrypt on successful login
  if (valid && !row.value.startsWith("$scrypt$")) {
    await setupPin(pin);
  }
  return valid;
}
