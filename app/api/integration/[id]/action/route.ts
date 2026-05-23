import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto";
import { portainerAction } from "@/lib/poller/fetchers/portainer";

const VALID_ACTIONS = new Set(["start", "stop", "restart"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, target } = await req.json() as { action: string; target: string };

  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const integration = await db.integration.findUnique({ where: { id } });
  if (!integration) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const config = decryptJson<Record<string, unknown>>(integration.config);

  try {
    switch (integration.type) {
      case "portainer":
        await portainerAction(
          config.url as string,
          config.apiToken as string,
          target,
          action as "start" | "stop" | "restart"
        );
        break;
      default:
        return NextResponse.json({ error: "Action not supported for this type" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
