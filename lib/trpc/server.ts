import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { isAuthenticatedFromCookieHeader } from "@/lib/session";
import { z } from "zod";

export function createContext({ req }: FetchCreateContextFnOptions) {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authed = isAuthenticatedFromCookieHeader(cookieHeader);
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
