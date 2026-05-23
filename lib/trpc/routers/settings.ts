import { router, protectedProcedure, publicProcedure, z } from "../server";
import { db } from "@/lib/db";
import { isPinSetup, setupPin, verifyPin } from "@/lib/auth";
import { readFileSync } from "fs";
import { join } from "path";

export const settingsRouter = router({
  isPinSetup: publicProcedure.query(() => isPinSetup()),

  setupPin: publicProcedure
    .input(z.object({ pin: z.string().min(4).max(8).regex(/^\d+$/) }))
    .mutation(async ({ input }) => {
      if (await isPinSetup()) throw new Error("PIN already configured");
      await setupPin(input.pin);
      return { ok: true };
    }),

  changePin: protectedProcedure
    .input(z.object({ currentPin: z.string(), newPin: z.string().min(4).max(8).regex(/^\d+$/) }))
    .mutation(async ({ input }) => {
      if (!(await verifyPin(input.currentPin))) throw new Error("Current PIN incorrect");
      await setupPin(input.newPin);
      return { ok: true };
    }),

  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const row = await db.setting.findUnique({ where: { key: input.key } });
      return row ? JSON.parse(row.value) : null;
    }),

  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.unknown() }))
    .mutation(({ input }) =>
      db.setting.upsert({
        where: { key: input.key },
        create: { key: input.key, value: JSON.stringify(input.value) },
        update: { value: JSON.stringify(input.value) },
      })
    ),

  getTheme: publicProcedure.query(async () => {
    const row = await db.setting.findUnique({ where: { key: "theme" } });
    return row ? JSON.parse(row.value) : defaultTheme();
  }),

  getAbout: protectedProcedure.query(async () => {
    const [pageCount, widgetCount, integrationCount] = await Promise.all([
      db.page.count(),
      db.widget.count(),
      db.integration.count(),
    ]);

    let version = "0.1.0";
    try {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string };
      version = pkg.version;
    } catch { /* ignore */ }

    return {
      version,
      pageCount,
      widgetCount,
      integrationCount,
      nodeVersion: process.version,
      uptime: process.uptime(),
    };
  }),

  exportConfig: protectedProcedure.query(async () => {
    const [pages, settings] = await Promise.all([
      db.page.findMany({
        orderBy: { order: "asc" },
        include: {
          widgets: {
            select: { type: true, title: true, config: true, posX: true, posY: true, w: true, h: true },
          },
        },
      }),
      db.setting.findMany(),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      version: "1",
      pages: pages.map((p) => ({
        name: p.name,
        slug: p.slug,
        icon: p.icon,
        order: p.order,
        widgets: p.widgets,
      })),
      settings: Object.fromEntries(settings.map((s) => [s.key, JSON.parse(s.value)])),
    };
  }),

  importConfig: protectedProcedure
    .input(z.object({
      pages: z.array(z.object({
        name: z.string(),
        slug: z.string(),
        icon: z.string().optional(),
        order: z.number().optional(),
        widgets: z.array(z.object({
          type: z.string(),
          title: z.string(),
          config: z.string(),
          posX: z.number(),
          posY: z.number(),
          w: z.number(),
          h: z.number(),
        })),
      })),
      settings: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      // Wipe existing pages (cascade deletes widgets)
      await db.page.deleteMany();

      for (const [idx, p] of input.pages.entries()) {
        const page = await db.page.create({
          data: {
            name: p.name,
            slug: p.slug + "-" + Date.now(),
            icon: p.icon ?? "layout-dashboard",
            order: p.order ?? idx,
          },
        });
        for (const w of p.widgets) {
          await db.widget.create({
            data: { ...w, pageId: page.id },
          });
        }
      }

      if (input.settings) {
        for (const [key, value] of Object.entries(input.settings)) {
          // Never overwrite auth settings via import
          if (key === "pin") continue;
          await db.setting.upsert({
            where: { key },
            create: { key, value: JSON.stringify(value) },
            update: { value: JSON.stringify(value) },
          });
        }
      }

      return { ok: true };
    }),
});

function defaultTheme() {
  return {
    accentColor: "#6366f1",
    background: "gradient",
    backgroundValue: "",
    widgetStyle: "glass",
    widgetOpacity: 85,
    fontScale: 100,
    customCss: "",
  };
}
