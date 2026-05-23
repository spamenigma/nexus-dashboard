export interface OPNsenseGateway {
  name: string;
  address: string;
  status: "online" | "offline" | "loss" | "delay" | "unknown";
  statusTranslated: string;
  delay: string;
  stddev: string;
  loss: string;
}

export interface OPNsenseData {
  gateways: OPNsenseGateway[];
  version?: string;
}

interface GatewayItem {
  name: string;
  address?: string;
  status?: string;
  status_translated?: string;
  delay?: string;
  stddev?: string;
  loss?: string;
}

function mapStatus(raw: string | undefined): OPNsenseGateway["status"] {
  const s = (raw ?? "").toLowerCase();
  if (s === "online" || s === "none") return "online";
  if (s.includes("offline")) return "offline";
  if (s.includes("loss")) return "loss";
  if (s.includes("delay") || s.includes("high")) return "delay";
  return "unknown";
}

export async function fetchOPNsense(url: string, apiKey: string, apiSecret: string): Promise<OPNsenseData> {
  const base = url.replace(/\/$/, "");
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const headers = { Authorization: `Basic ${auth}`, Accept: "application/json" };

  const [gatewayRes] = await Promise.all([
    fetch(`${base}/api/routes/gateway/status`, { headers, signal: AbortSignal.timeout(10_000) }),
  ]);

  if (!gatewayRes.ok) throw new Error(`OPNsense API: HTTP ${gatewayRes.status}`);

  const gatewayData = await gatewayRes.json() as { items?: GatewayItem[] } | GatewayItem[];
  const items: GatewayItem[] = Array.isArray(gatewayData)
    ? gatewayData
    : (gatewayData.items ?? []);

  const gateways: OPNsenseGateway[] = items.map((g) => ({
    name: g.name,
    address: g.address ?? "",
    status: mapStatus(g.status),
    statusTranslated: g.status_translated ?? g.status ?? "unknown",
    delay: g.delay ?? "~",
    stddev: g.stddev ?? "~",
    loss: g.loss ?? "~",
  }));

  return { gateways };
}
