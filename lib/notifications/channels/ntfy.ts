export interface NtfyConfig {
  url: string;
  topic: string;
  token?: string;
}

const PRIORITY: Record<string, string> = { critical: "urgent", warning: "high", info: "default" };
const TAGS: Record<string, string> = { critical: "rotating_light", warning: "warning", info: "white_check_mark" };

export async function sendNtfy(
  config: NtfyConfig,
  title: string,
  message: string,
  severity: string
): Promise<void> {
  const base = config.url.replace(/\/$/, "");
  const headers: Record<string, string> = {
    Title: title,
    Priority: PRIORITY[severity] ?? "default",
    Tags: TAGS[severity] ?? "bell",
  };
  if (config.token) headers["Authorization"] = `Bearer ${config.token}`;

  const res = await fetch(`${base}/${config.topic}`, {
    method: "POST",
    headers,
    body: message,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`ntfy: HTTP ${res.status}`);
}
