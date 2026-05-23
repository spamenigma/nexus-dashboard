export interface WireGuardPeer {
  id: string;
  name: string;
  enabled: boolean;
  address: string;
  latestHandshakeAt?: string;
  transferRxBytes: number;
  transferTxBytes: number;
  isOnline: boolean;
}

export interface WireGuardData {
  peers: WireGuardPeer[];
  onlineCount: number;
  totalCount: number;
}

// A peer is considered online if it has handshaked within the last 3 minutes
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

export async function fetchWireGuardEasy(url: string, password: string): Promise<WireGuardData> {
  const base = url.replace(/\/$/, "");

  // Authenticate — wg-easy uses session cookies
  const loginRes = await fetch(`${base}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
    signal: AbortSignal.timeout(8000),
  });

  if (!loginRes.ok) throw new Error(`wg-easy auth failed: ${loginRes.status}`);

  // Extract session cookie to authenticate subsequent requests
  const cookieHeader = loginRes.headers.get("set-cookie") ?? "";
  const sessionCookie = cookieHeader.split(";")[0]; // take first cookie segment

  const clientsRes = await fetch(`${base}/api/wireguard/client`, {
    headers: { Cookie: sessionCookie },
    signal: AbortSignal.timeout(8000),
  });

  if (!clientsRes.ok) throw new Error(`wg-easy clients responded ${clientsRes.status}`);

  const clients = await clientsRes.json() as WireGuardClientRecord[];
  const now = Date.now();

  const peers: WireGuardPeer[] = clients.map((c) => {
    const handshakeAge = c.latestHandshakeAt
      ? now - new Date(c.latestHandshakeAt).getTime()
      : Infinity;
    return {
      id: c.id,
      name: c.name,
      enabled: c.enabled,
      address: c.address ?? "",
      latestHandshakeAt: c.latestHandshakeAt ?? undefined,
      transferRxBytes: c.transferRx ?? 0,
      transferTxBytes: c.transferTx ?? 0,
      isOnline: c.enabled && handshakeAge < ONLINE_THRESHOLD_MS,
    };
  });

  return {
    peers,
    onlineCount: peers.filter((p) => p.isOnline).length,
    totalCount: peers.length,
  };
}

interface WireGuardClientRecord {
  id: string;
  name: string;
  enabled: boolean;
  address?: string;
  latestHandshakeAt?: string | null;
  transferRx?: number;
  transferTx?: number;
}
