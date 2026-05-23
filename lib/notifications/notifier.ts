import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto";
import { broadcast } from "@/lib/poller/sse-hub";
import { onPollError, onPollSuccess, type ChangeEvent } from "./state-tracker";
import { sendDiscord, type DiscordConfig } from "./channels/discord";
import { sendSlack, type SlackConfig } from "./channels/slack";
import { sendNtfy, type NtfyConfig } from "./channels/ntfy";
import { sendGotify, type GotifyConfig } from "./channels/gotify";
import { sendTelegram, type TelegramConfig } from "./channels/telegram";
import { sendWebhook, type WebhookConfig } from "./channels/webhook";

interface NotificationPayload {
  integrationId?: string;
  integrationName?: string;
  type: string;
  severity: string;
  message: string;
}

async function createNotification(payload: NotificationPayload): Promise<void> {
  const note = await db.notification.create({
    data: {
      integrationId: payload.integrationId ?? null,
      integrationName: payload.integrationName ?? null,
      type: payload.type,
      severity: payload.severity,
      message: payload.message,
    },
  });

  const unreadCount = await db.notification.count({ where: { read: false } });
  broadcast("notification-new", {
    notification: {
      id: note.id,
      integrationId: note.integrationId,
      integrationName: note.integrationName,
      type: note.type,
      severity: note.severity,
      message: note.message,
      read: false,
      createdAt: note.createdAt,
    },
    unreadCount,
  });

  fireChannels(payload).catch((err) =>
    console.error("[notifier] channel dispatch error:", err)
  );
}

async function fireChannels(payload: NotificationPayload): Promise<void> {
  const channels = await db.notificationChannel.findMany({ where: { enabled: true } });
  const title = buildTitle(payload);

  await Promise.allSettled(
    channels.map(async (channel) => {
      try {
        const config = decryptJson<Record<string, unknown>>(channel.config);
        await dispatch(channel.type, config, title, payload.message, payload.severity, payload);
      } catch (err) {
        console.error(`[notifier] channel ${channel.id} (${channel.type}) failed:`, err);
      }
    })
  );
}

function buildTitle(payload: NotificationPayload): string {
  const name = payload.integrationName ?? "System";
  switch (payload.type) {
    case "error":    return `${name} — Fetch Failed`;
    case "recovery": return `${name} — Recovered`;
    case "down":     return `${name} — Service Down`;
    case "warning":  return `${name} — Warning`;
    default:         return `${name} — Alert`;
  }
}

async function dispatch(
  type: string,
  config: Record<string, unknown>,
  title: string,
  message: string,
  severity: string,
  payload: NotificationPayload
): Promise<void> {
  switch (type) {
    case "discord":  await sendDiscord(config as unknown as DiscordConfig, title, message, severity); break;
    case "slack":    await sendSlack(config as unknown as SlackConfig, title, message, severity); break;
    case "ntfy":     await sendNtfy(config as unknown as NtfyConfig, title, message, severity); break;
    case "gotify":   await sendGotify(config as unknown as GotifyConfig, title, message, severity); break;
    case "telegram": await sendTelegram(config as unknown as TelegramConfig, title, message, severity); break;
    case "webhook":
      await sendWebhook(config as unknown as WebhookConfig, title, message, severity, {
        type: payload.type,
        integrationId: payload.integrationId,
        integrationName: payload.integrationName,
      });
      break;
  }
}

export async function processIntegrationError(
  integrationId: string,
  integrationName: string,
  error: string
): Promise<void> {
  const events = onPollError(integrationId);
  for (const ev of events) {
    if (ev.kind === "integration-down") {
      await createNotification({
        integrationId,
        integrationName,
        type: "error",
        severity: "critical",
        message: `"${integrationName}" failed to fetch data: ${error}`,
      });
    }
  }
}

export async function processIntegrationUpdate(
  integrationId: string,
  integrationName: string,
  type: string,
  data: unknown
): Promise<void> {
  const events = onPollSuccess(integrationId, type, data);
  for (const ev of events) {
    await handleChangeEvent(integrationId, integrationName, ev);
  }
}

async function handleChangeEvent(
  integrationId: string,
  integrationName: string,
  ev: ChangeEvent
): Promise<void> {
  switch (ev.kind) {
    case "integration-recovery":
      await createNotification({
        integrationId,
        integrationName,
        type: "recovery",
        severity: "info",
        message: `"${integrationName}" has recovered and is now responding.`,
      });
      break;
    case "item-down":
      await createNotification({
        integrationId,
        integrationName,
        type: "down",
        severity: "critical",
        message: `${ev.itemName} is DOWN (via ${integrationName})`,
      });
      break;
    case "item-recovery":
      await createNotification({
        integrationId,
        integrationName,
        type: "recovery",
        severity: "info",
        message: `${ev.itemName} has recovered (via ${integrationName})`,
      });
      break;
  }
}

export async function sendTestToChannel(channelId: string): Promise<void> {
  const channel = await db.notificationChannel.findUniqueOrThrow({ where: { id: channelId } });
  const config = decryptJson<Record<string, unknown>>(channel.config);
  await dispatch(
    channel.type,
    config,
    "Test Notification",
    "This is a test notification from Nexus Dashboard.",
    "info",
    { type: "info", severity: "info", message: "Test notification" }
  );
}
