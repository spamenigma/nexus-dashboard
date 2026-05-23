export interface GotifyConfig {
  url: string;
  token: string;
  priority?: number;
}

const DEFAULT_PRIORITY: Record<string, number> = { critical: 8, warning: 5, info: 3 };

export async function sendGotify(
  config: GotifyConfig,
  title: string,
  message: string,
  severity: string
): Promise<void> {
  const base = config.url.replace(/\/$/, "");
  const priority = config.priority ?? DEFAULT_PRIORITY[severity] ?? 5;

  const res = await fetch(`${base}/message?token=${encodeURIComponent(config.token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, message, priority }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Gotify: HTTP ${res.status}`);
}
