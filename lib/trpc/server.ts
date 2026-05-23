import { initTRPC, TRPCError } from "@trpc/server";
import { isAuthenticated } from "@/lib/session";
import { z } from "zod";

export async function createContext() {
  const authed = await isAuthenticated();
  return { authed };
}

type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.authed) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx });
});

export { z };
