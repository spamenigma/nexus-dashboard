import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/session";
import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto";

const ALLOWED_TYPES = new Set(["anthropic", "ollama", "openai"]);
const MAX_PROMPT_LEN = 8000;
const MAX_MODEL_LEN = 100;

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { integrationId, prompt, model, systemPrompt } = await req.json() as {
    integrationId: string;
    prompt: string;
    model?: string;
    systemPrompt?: string;
  };

  if (!prompt?.trim()) return NextResponse.json({ error: "No prompt" }, { status: 400 });
  if (prompt.length > MAX_PROMPT_LEN) return NextResponse.json({ error: "Prompt too long" }, { status: 400 });
  if (model && model.length > MAX_MODEL_LEN) return NextResponse.json({ error: "Invalid model" }, { status: 400 });
  if (systemPrompt && systemPrompt.length > MAX_PROMPT_LEN) return NextResponse.json({ error: "System prompt too long" }, { status: 400 });

  const integration = await db.integration.findUnique({ where: { id: integrationId } });
  if (!integration) return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  if (!ALLOWED_TYPES.has(integration.type)) return NextResponse.json({ error: "Unsupported integration type" }, { status: 400 });

  const config = decryptJson<Record<string, unknown>>(integration.config);

  try {
    const text = await callAI(integration.type, config, prompt, model, systemPrompt);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

async function callAI(
  type: string,
  config: Record<string, unknown>,
  prompt: string,
  model?: string,
  systemPrompt?: string
): Promise<string> {
  const userMessages = [{ role: "user", content: prompt }];

  if (type === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model ?? "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        ...(systemPrompt ? { system: systemPrompt } : {}),
        messages: userMessages,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json() as { content: { type: string; text: string }[] };
    return data.content.find((c) => c.type === "text")?.text ?? "";
  }

  if (type === "ollama") {
    const base = (config.url as string).replace(/\/$/, "");
    const messages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...userMessages,
    ];
    const res = await fetch(`${base}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: model ?? "llama3.2", messages, stream: false }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json() as { message?: { content: string } };
    return data.message?.content ?? "";
  }

  // OpenAI (default) — also handles custom base URLs
  const base = config.url ? (config.url as string).replace(/\/$/, "") : "https://api.openai.com";
  const messages = [
    ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
    ...userMessages,
  ];
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey as string}`,
    },
    body: JSON.stringify({ model: model ?? "gpt-4o-mini", messages, max_tokens: 1024 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}
