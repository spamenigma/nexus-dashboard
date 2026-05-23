import { NextRequest, NextResponse } from "next/server";
import { isAuthenticatedFromCookieHeader } from "@/lib/session";

// Paths that bypass auth — webhook is intentionally unauthenticated (external services post here)
const PUBLIC_PATHS = ["/login", "/setup", "/api/auth", "/api/health", "/api/trpc", "/api/webhook"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!isAuthenticatedFromCookieHeader(cookieHeader)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
