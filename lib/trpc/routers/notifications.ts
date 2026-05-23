import { router, protectedProcedure, z } from "../server";
import { db } from "@/lib/db";
import { encryptJson, decryptJson } from "@/lib/crypto";
import { sendTestToChannel } from "@/lib/notifications/notifier";

const MASKED = "••••••••";

const SECRET_FIELDS: Record<string, string[]> = {
  discord:  ["webhookUrl"],
  slack:    ["webhookUrl"],
  ntfy:     ["token"],
  gotify:   ["token"],
  telegram: ["botToken"],
  webhook:  [],
};

function maskConfig(type: string, config: Record<string, unknown>) {
  const masked = { ...config };
  for (const f of SECRET_FIELDS[type] ?? []) {
    if (masked[f]) masked[f] = MASKED;
  }
  return masked;
}

function mergeConfig(
  type: string,
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>
) {
  const merged = { ...incoming };
  for (const f of SECRET_FIELDS[type] ?? []) {
    if (merged[f] === MASKED && existing[f]) merged[f] = existing[f];
  }
  return merged;
}

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().default(50), unreadOnly: z.boolean().default(false) }))
    .query(({ input }) =>
      db.notification.findMany({
        where: input.unreadOnly ? { read: false } : undefined,
        orderBy: { createdAt: "desc" },
        take: input.limit,
      })
    ),

  unreadCount: protectedProcedure.query(() =>
    db.notification.count({ where: { read: false } })
  ),

  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) =>
      db.notification.update({ where: { id: input.id }, data: { read: true } })
    ),

  markAllRead: protectedProcedure.mutation(() =>
    db.notification.updateMany({ where: { read: false }, data: { read: true } })
  ),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => db.notification.delete({ where: { id: input.id } })),

  clearAll: protectedProcedure.mutation(() => db.notification.deleteMany()),

  // ── Channels ────────────────────────────────────────────────────────────

  channelList: protectedProcedure.query(async () => {
    const rows = await db.notificationChannel.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map((c) => ({
      ...c,
      config: maskConfig(c.type, decryptJson<Record<string, unknown>>(c.config)),
    }));
  }),

  channelCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      type: z.enum(["discord", "slack", "ntfy", "gotify", "telegram", "webhook"]),
      config: z.record(z.string(), z.unknown()),
    }))
    .mutation(({ input }) =>
      db.notificationChannel.create({
        data: { name: input.name, type: input.type, config: encryptJson(input.config) },
      })
    ),

  channelUpdate: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      enabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const channel = await db.notificationChannel.findUniqueOrThrow({ where: { id: input.id } });
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.enabled !== undefined) updates.enabled = input.enabled;
      if (input.config !== undefined) {
        const existing = decryptJson<Record<string, unknown>>(channel.config);
        updates.config = encryptJson(mergeConfig(channel.type, existing, input.config));
      }
      return db.notificationChannel.update({ where: { id: input.id }, data: updates });
    }),

  channelDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => db.notificationChannel.delete({ where: { id: input.id } })),

  channelTest: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => sendTestToChannel(input.id)),
});
