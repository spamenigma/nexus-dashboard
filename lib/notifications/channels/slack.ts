export interface SlackConfig {
  webhookUrl: string;
}

const EMOJI: Record<string, string> = { critical: "🔴", warning: "🟡", info: "🟢" };

export async function sendSlack(
  config: SlackConfig,
  title: string,
  message: string,
  severity: string
): Promise<void> {
  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: `${EMOJI[severity] ?? "⚪"} *${title}*\n${message}` }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Slack webhook: HTTP ${res.status}`);
}
