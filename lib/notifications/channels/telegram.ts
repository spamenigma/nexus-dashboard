export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

const EMOJI: Record<string, string> = { critical: "🔴", warning: "🟡", info: "🟢" };

export async function sendTelegram(
  config: TelegramConfig,
  title: string,
  message: string,
  severity: string
): Promise<void> {
  const text = `${EMOJI[severity] ?? "⚪"} <b>${title}</b>\n${message}`;
  const res = await fetch(
    `https://api.telegram.org/bot${config.botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!res.ok) throw new Error(`Telegram: HTTP ${res.status}`);
}
