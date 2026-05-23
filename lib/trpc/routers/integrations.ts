import { router, protectedProcedure, z } from "../server";
import { db } from "@/lib/db";
import { encryptJson, decryptJson } from "@/lib/crypto";

export const integrationsRouter = router({
  list: protectedProcedure.query(async () => {
    const rows = await db.integration.findMany({ orderBy: { name: "asc" } });
    return rows.map((r) => ({ id: r.id, name: r.name, type: r.type, createdAt: r.createdAt }));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const row = await db.integration.findUniqueOrThrow({ where: { id: input.id } });
      const config = decryptJson<Record<string, unknown>>(row.config);
      // Mask secret fields for the UI (return placeholder)
      const masked = Object.fromEntries(
        Object.entries(config).map(([k, v]) =>
          k.toLowerCase().includes("key") || k.toLowerCase().includes("password") || k.toLowerCase().includes("token") || k.toLowerCase().includes("secret")
            ? [k, "••••••••"]
            : [k, v]
        )
      );
      return { id: row.id, name: row.name, type: row.type, config: masked };
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), type: z.string(), config: z.record(z.string(), z.unknown()) }))
    .mutation(({ input }) =>
      db.integration.create({
        data: {
          name: input.name,
          type: input.type,
          config: encryptJson(input.config),
        },
      })
    ),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), config: z.record(z.string(), z.unknown()).optional() }))
    .mutation(async ({ input }) => {
      const { id, name, config } = input;
      const updates: Record<string, string> = {};
      if (name) updates.name = name;
      if (config) {
        // Merge: if field is masked placeholder, keep existing value
        const existing = await db.integration.findUniqueOrThrow({ where: { id } });
        const existingConfig = decryptJson<Record<string, unknown>>(existing.config);
        const merged = { ...existingConfig };
        for (const [k, v] of Object.entries(config)) {
          if (v !== "••••••••") merged[k] = v;
        }
        updates.config = encryptJson(merged);
      }
      return db.integration.update({ where: { id }, data: updates });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => db.integration.delete({ where: { id: input.id } })),
});
