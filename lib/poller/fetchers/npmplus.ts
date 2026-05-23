export interface NPMProxyHost {
  id: number;
  domains: string[];
  enabled: boolean;
  sslForced: boolean;
  certExpiry?: string;
  certProvider?: string;
  daysUntilExpiry?: number;
}

export interface NPMData {
  hosts: NPMProxyHost[];
}

export async function fetchNPMPlus(url: string, email: string, password: string): Promise<NPMData> {
  const base = url.replace(/\/$/, "");
  const sig = AbortSignal.timeout(10000);

  // Authenticate — NPM uses short-lived tokens so we re-auth each poll
  const authRes = await fetch(`${base}/api/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, secret: password }),
    signal: sig,
  });

  if (!authRes.ok) throw new Error(`NPM auth failed: ${authRes.status}`);
  const { token } = await authRes.json() as { token: string };

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch proxy hosts with embedded certificate data
  const hostsRes = await fetch(`${base}/api/nginx/proxy-hosts?expand=certificate`, {
    headers,
    signal: sig,
  });

  if (!hostsRes.ok) throw new Error(`NPM proxy-hosts responded ${hostsRes.status}`);

  const hostsData = await hostsRes.json() as NPMHostRecord[];
  const now = Date.now();

  const hosts: NPMProxyHost[] = hostsData.map((h) => {
    const cert = h.certificate ?? null;
    let daysUntilExpiry: number | undefined;
    let certExpiry: string | undefined;

    if (cert?.expires_on) {
      certExpiry = cert.expires_on;
      daysUntilExpiry = Math.floor((new Date(cert.expires_on).getTime() - now) / 86_400_000);
    }

    return {
      id: h.id,
      domains: h.domain_names ?? [],
      enabled: h.enabled === 1 || h.enabled === true,
      sslForced: h.ssl_forced === 1 || h.ssl_forced === true,
      certExpiry,
      certProvider: cert?.provider,
      daysUntilExpiry,
    };
  });

  return { hosts };
}

interface NPMHostRecord {
  id: number;
  domain_names?: string[];
  enabled?: number | boolean;
  ssl_forced?: number | boolean;
  certificate?: {
    id: number;
    provider?: string;
    expires_on?: string;
    domain_names?: string[];
  } | null;
}
