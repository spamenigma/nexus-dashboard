export interface WebhookConfig {
  url: string;
  method?: "POST" | "PUT";
  headers?: Record<string, string>;
}

export async function sendWebhook(
  config: WebhookConfig,
  title: string,
  message: string,
  severity: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const res = await fetch(config.url, {
    method: config.method ?? "POST",
    headers: { "Content-Type": "application/json", ...(config.headers ?? {}) },
    body: JSON.stringify({
      title,
      message,
      severity,
      source: "nexus-dashboard",
      timestamp: new Date().toISOString(),
      ...extra,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Webhook: HTTP ${res.status}`);
}
