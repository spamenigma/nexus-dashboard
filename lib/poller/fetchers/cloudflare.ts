export interface CloudflareData {
  recordName: string;
  recordIp: string;
  publicIp: string;
  inSync: boolean;
  lastModified: string;
}

interface CfDnsRecord {
  name: string;
  content: string;
  modified_on: string;
}

interface CfResponse {
  success: boolean;
  result: CfDnsRecord;
}

interface IpifyResponse { ip: string }

export async function fetchCloudflare(apiToken: string, zoneId: string, recordId: string): Promise<CloudflareData> {
  const [cfRes, ipRes] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
    }),
    fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5_000) }),
  ]);

  if (!cfRes.ok) throw new Error(`Cloudflare API: HTTP ${cfRes.status}`);
  const cf = await cfRes.json() as CfResponse;
  if (!cf.success) throw new Error("Cloudflare API returned error");

  const publicIp = ipRes.ok ? ((await ipRes.json() as IpifyResponse).ip) : "unknown";

  return {
    recordName: cf.result.name,
    recordIp: cf.result.content,
    publicIp,
    inSync: cf.result.content === publicIp,
    lastModified: cf.result.modified_on,
  };
}
