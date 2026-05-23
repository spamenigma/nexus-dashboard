import { createHash } from "crypto";
import { db } from "./db";

const PIN_KEY = "auth.pinHash";
const SETUP_DONE_KEY = "auth.setupDone";

export function hashPin(pin: string): string {
  return createHash("sha256").update(`nexus:${pin}`).digest("hex");
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
  return row.value === hashPin(pin);
}
