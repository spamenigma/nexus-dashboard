export interface UptimeMonitor {
  id: number;
  name: string;
  status: "up" | "down" | "pending" | "unknown";
  uptime24h: number;    // percent 0–100
  responseMs: number;
  url?: string;
  tags: string[];
}

export async function fetchUptimeKuma(url: string, apiKey: string): Promise<UptimeMonitor[]> {
  const base = url.replace(/\/$/, "");

  // Uptime Kuma REST API (requires API key from Settings → API Keys in Kuma)
  const res = await fetch(`${base}/metrics`, {
    headers: { Authorization: `Basic ${Buffer.from(`apikey:${apiKey}`).toString("base64")}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Uptime Kuma responded ${res.status}`);

  const text = await res.text();
  return parsePrometheusMetrics(text);
}

function parsePrometheusMetrics(text: string): UptimeMonitor[] {
  const monitors = new Map<string, Partial<UptimeMonitor>>();

  for (const line of text.split("\n")) {
    if (line.startsWith("#")) continue;

    const statusMatch = line.match(/monitor_status\{.*?monitor_name="([^"]+)".*?\}\s+(\d)/);
    if (statusMatch) {
      const name = statusMatch[1];
      const code = parseInt(statusMatch[2]);
      if (!monitors.has(name)) monitors.set(name, { name, tags: [] });
      monitors.get(name)!.status = code === 1 ? "up" : code === 0 ? "down" : "pending";
    }

    const uptimeMatch = line.match(/monitor_uptime\{.*?monitor_name="([^"]+)".*?duration="720h".*?\}\s+([\d.]+)/);
    if (uptimeMatch) {
      const name = uptimeMatch[1];
      if (!monitors.has(name)) monitors.set(name, { name, tags: [] });
      monitors.get(name)!.uptime24h = Math.round(parseFloat(uptimeMatch[2]) * 1000) / 10;
    }

    const responseMatch = line.match(/monitor_response_time\{.*?monitor_name="([^"]+)".*?\}\s+([\d.]+)/);
    if (responseMatch) {
      const name = responseMatch[1];
      if (!monitors.has(name)) monitors.set(name, { name, tags: [] });
      monitors.get(name)!.responseMs = Math.round(parseFloat(responseMatch[2]));
    }
  }

  return Array.from(monitors.values()).map((m, i) => ({
    id: i,
    name: m.name ?? "",
    status: m.status ?? "unknown",
    uptime24h: m.uptime24h ?? 0,
    responseMs: m.responseMs ?? 0,
    tags: m.tags ?? [],
  }));
}
