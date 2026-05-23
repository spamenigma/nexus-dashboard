import { router, protectedProcedure, z } from "../server";
import { db } from "@/lib/db";

export const pagesRouter = router({
  list: protectedProcedure.query(() =>
    db.page.findMany({ orderBy: { order: "asc" } })
  ),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), icon: z.string().optional() }))
    .mutation(async ({ input }) => {
      const count = await db.page.count();
      return db.page.create({
        data: {
          name: input.name,
          slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "page",
          icon: input.icon ?? "layout-dashboard",
          order: count,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), icon: z.string().optional(), order: z.number().optional() }))
    .mutation(({ input }) => {
      const { id, ...data } = input;
      return db.page.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => db.page.delete({ where: { id: input.id } })),
});
