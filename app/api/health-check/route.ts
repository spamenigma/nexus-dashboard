import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";

export const dynamic = "force-dynamic";

interface CheckInput { name: string; url: string }
interface CheckResult { name: string; url: string; ok: boolean; status: number; latencyMs: number; error?: string }

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { checks: CheckInput[] };
  const checks = (body.checks ?? []).slice(0, 20);

  const results: CheckResult[] = await Promise.all(
    checks.map(async ({ name, url }) => {
      const start = Date.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000), cache: "no-store" });
        return { name, url, ok: res.ok, status: res.status, latencyMs: Date.now() - start };
      } catch (err) {
        return {
          name, url, ok: false, status: 0,
          latencyMs: Date.now() - start,
          error: err instanceof Error ? err.message : "Timeout",
        };
      }
    })
  );

  return NextResponse.json(results);
}
