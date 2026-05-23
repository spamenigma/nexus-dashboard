import { NextRequest, NextResponse } from "next/server";
import { broadcast } from "@/lib/poller/sse-hub";

// In-memory webhook history (resets on restart, suitable for display purposes)
const webhookHistory = new Map<string, Array<{ id: string; receivedAt: string; body: unknown }>>();

export async function POST(req: NextRequest, { params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = await params;

  let body: unknown;
  const ct = req.headers.get("content-type") ?? "";
  try {
    body = ct.includes("application/json") ? await req.json() : await req.text();
  } catch {
    body = await req.text().catch(() => "");
  }

  const entry = { id: crypto.randomUUID(), receivedAt: new Date().toISOString(), body };

  const history = webhookHistory.get(widgetId) ?? [];
  history.unshift(entry);
  webhookHistory.set(widgetId, history.slice(0, 50));

  broadcast("webhook", { widgetId, type: "webhook", payload: entry });

  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = await params;
  return NextResponse.json(webhookHistory.get(widgetId) ?? []);
}
