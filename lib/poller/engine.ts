// Background integration poller.
// Runs once per integration type on a timer, caches results, broadcasts via SSE.
import { db } from "@/lib/db";
import { decryptJson } from "@/lib/crypto";
import { setCache, setCacheError } from "./cache";
import { broadcast } from "./sse-hub";
import { fetchNetdata } from "./fetchers/netdata";
import { fetchUptimeKuma } from "./fetchers/uptime-kuma";
import { fetchPortainerContainers } from "./fetchers/portainer";
import { fetchJellyfin } from "./fetchers/jellyfin";
import { fetchRadarr } from "./fetchers/radarr";
import { fetchSonarr } from "./fetchers/sonarr";
import { fetchJellyseerr } from "./fetchers/jellyseerr";
import { fetchSABnzbd } from "./fetchers/sabnzbd";
import { fetchNPMPlus } from "./fetchers/npmplus";
import { fetchWireGuardEasy } from "./fetchers/wireguard";
import { fetchNextcloud } from "./fetchers/nextcloud";
import { fetchIMAP } from "./fetchers/imap";
import { fetchDoku } from "./fetchers/doku";
import { fetchCloudflare } from "./fetchers/cloudflare";
import { fetchOPNsense } from "./fetchers/opnsense";
import { connectMqtt, getMqttData, disconnectMqtt } from "./fetchers/mqtt-client";
import { processIntegrationUpdate, processIntegrationError } from "@/lib/notifications/notifier";

const POLL_INTERVALS: Record<string, number> = {
  "netdata": 5_000,
  "uptime-kuma": 15_000,
  "portainer": 10_000,
  "jellyfin": 30_000,
  "radarr": 60_000,
  "sonarr": 60_000,
  "jellyseerr": 120_000,
  "sabnzbd": 10_000,
  "npmplus": 3_600_000,
  "wireguard-easy": 30_000,
  "nextcloud": 300_000,
  "imap": 300_000,
  "doku": 60_000,
  "cloudflare": 300_000,
  "opnsense": 30_000,
};

const timers = new Map<string, ReturnType<typeof setInterval>>();
let started = false;

export function startPoller() {
  if (started) return;
  started = true;
  schedulePoll();
}

async function schedulePoll() {
  try {
    const integrations = await db.integration.findMany();
    for (const integration of integrations) {
      if (timers.has(integration.id)) continue;

      // MQTT is handled via persistent connection, not interval polling
      if (integration.type === "mqtt") {
        startMqttIntegration(integration.id, integration.config);
        continue;
      }

      const interval = POLL_INTERVALS[integration.type];
      if (!interval) continue;

      pollOne(integration.id, integration.type, integration.config, integration.name);
      const timer = setInterval(async () => {
        const fresh = await db.integration.findUnique({ where: { id: integration.id } }).catch(() => null);
        if (!fresh) { clearInterval(timer); timers.delete(integration.id); return; }
        pollOne(fresh.id, fresh.type, fresh.config, fresh.name);
      }, interval);
      timers.set(integration.id, timer);
    }
  } catch {
    setTimeout(schedulePoll, 5_000);
  }
}

function startMqttIntegration(id: string, configCiphertext: string) {
  const config = decryptJson<Record<string, unknown>>(configCiphertext);
  const url = config.url as string;
  const topics = ((config.topics as string) ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  if (!url || topics.length === 0) return;

  connectMqtt(
    id,
    url,
    config.username as string | undefined,
    config.password as string | undefined,
    topics,
    (data) => {
      setCache(id, data);
      broadcast("integration-update", { integrationId: id, type: "mqtt", data });
    }
  );
  // Mark as "started" so schedulePoll doesn't try again
  timers.set(id, 0 as unknown as ReturnType<typeof setInterval>);
}

async function pollOne(id: string, type: string, configCiphertext: string, name = "") {
  try {
    const config = decryptJson<Record<string, unknown>>(configCiphertext);
    const url = config.url as string;
    let data: unknown;

    switch (type) {
      case "netdata":
        data = await fetchNetdata(url, config.apiKey as string | undefined);
        break;
      case "uptime-kuma":
        data = await fetchUptimeKuma(url, config.apiKey as string);
        break;
      case "portainer":
        data = await fetchPortainerContainers(url, config.apiToken as string);
        break;
      case "jellyfin":
        data = await fetchJellyfin(url, config.apiKey as string);
        break;
      case "radarr":
        data = await fetchRadarr(url, config.apiKey as string);
        break;
      case "sonarr":
        data = await fetchSonarr(url, config.apiKey as string);
        break;
      case "jellyseerr":
        data = await fetchJellyseerr(url, config.apiKey as string);
        break;
      case "sabnzbd":
        data = await fetchSABnzbd(url, config.apiKey as string);
        break;
      case "npmplus":
        data = await fetchNPMPlus(url, config.email as string, config.password as string);
        break;
      case "wireguard-easy":
        data = await fetchWireGuardEasy(url, config.password as string);
        break;
      case "nextcloud":
        data = await fetchNextcloud(url, config.username as string, config.password as string);
        break;
      case "imap":
        data = await fetchIMAP(
          config.host as string,
          Number(config.port ?? 993),
          config.user as string,
          config.password as string,
          (config.extraFolders as string[] | undefined) ?? []
        );
        break;
      case "doku":
        data = await fetchDoku(url);
        break;
      case "cloudflare":
        data = await fetchCloudflare(
          config.apiToken as string,
          config.zoneId as string,
          config.recordId as string
        );
        break;
      case "opnsense":
        data = await fetchOPNsense(url, config.apiKey as string, config.apiSecret as string);
        break;
      default:
        return;
    }

    setCache(id, data);
    broadcast("integration-update", { integrationId: id, type, data });
    processIntegrationUpdate(id, name, type, data).catch(console.error);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    setCacheError(id, msg);
    broadcast("integration-error", { integrationId: id, type, error: msg });
    processIntegrationError(id, name, msg).catch(console.error);
  }
}

export function addIntegrationToPoller(id: string, type: string, configCiphertext: string, name = "") {
  if (timers.has(id)) return;

  if (type === "mqtt") {
    startMqttIntegration(id, configCiphertext);
    return;
  }

  const interval = POLL_INTERVALS[type];
  if (!interval) return;
  pollOne(id, type, configCiphertext, name);
  const timer = setInterval(async () => {
    const fresh = await db.integration.findUnique({ where: { id } }).catch(() => null);
    if (!fresh) { clearInterval(timer); timers.delete(id); return; }
    pollOne(fresh.id, fresh.type, fresh.config, fresh.name);
  }, interval);
  timers.set(id, timer);
}

export function stopIntegrationPoller(id: string) {
  const timer = timers.get(id);
  if (timer) { clearInterval(timer); timers.delete(id); }
  disconnectMqtt(id); // no-op if not an MQTT integration
}
