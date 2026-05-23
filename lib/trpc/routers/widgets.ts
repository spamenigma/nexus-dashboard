import { router, protectedProcedure, z } from "../server";
import { db } from "@/lib/db";

const widgetInput = z.object({
  type: z.string(),
  pageId: z.string(),
  title: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  w: z.number().optional(),
  h: z.number().optional(),
});

export const widgetsRouter = router({
  byPage: protectedProcedure
    .input(z.object({ pageId: z.string() }))
    .query(({ input }) =>
      db.widget.findMany({ where: { pageId: input.pageId } })
    ),

  create: protectedProcedure
    .input(widgetInput)
    .mutation(({ input }) =>
      db.widget.create({
        data: {
          type: input.type,
          pageId: input.pageId,
          title: input.title ?? "",
          config: JSON.stringify(input.config ?? {}),
          posX: input.posX ?? 0,
          posY: input.posY ?? 999,
          w: input.w ?? 4,
          h: input.h ?? 3,
        },
      })
    ),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      config: z.record(z.string(), z.unknown()).optional(),
      posX: z.number().optional(),
      posY: z.number().optional(),
      w: z.number().optional(),
      h: z.number().optional(),
    }))
    .mutation(({ input }) => {
      const { id, config, ...rest } = input;
      return db.widget.update({
        where: { id },
        data: {
          ...rest,
          ...(config !== undefined ? { config: JSON.stringify(config) } : {}),
        },
      });
    }),

  updateLayout: protectedProcedure
    .input(z.array(z.object({ id: z.string(), posX: z.number(), posY: z.number(), w: z.number(), h: z.number() })))
    .mutation(async ({ input }) => {
      await Promise.all(
        input.map((item) =>
          db.widget.update({
            where: { id: item.id },
            data: { posX: item.posX, posY: item.posY, w: item.w, h: item.h },
          })
        )
      );
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => db.widget.delete({ where: { id: input.id } })),
});
