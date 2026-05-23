export interface DiscordConfig {
  webhookUrl: string;
}

const COLORS: Record<string, number> = {
  critical: 0xff4444,
  warning: 0xf59e0b,
  info: 0x22c55e,
};

export async function sendDiscord(
  config: DiscordConfig,
  title: string,
  message: string,
  severity: string
): Promise<void> {
  const res = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "Nexus Dashboard",
      embeds: [
        {
          title,
          description: message,
          color: COLORS[severity] ?? 0x888888,
          timestamp: new Date().toISOString(),
          footer: { text: "Nexus Dashboard" },
        },
      ],
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok && res.status !== 204) throw new Error(`Discord webhook: HTTP ${res.status}`);
}
