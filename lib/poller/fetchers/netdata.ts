export interface NetdataStats {
  cpu: number;          // percent 0–100
  ram: { used: number; total: number };  // bytes
  disk: { read: number; write: number }; // bytes/s
  net: { received: number; sent: number }; // bits/s
  uptime: number;       // seconds
  hostname: string;
}

export async function fetchNetdata(url: string, apiKey?: string): Promise<NetdataStats> {
  const base = url.replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (apiKey) headers["X-Auth-Token"] = apiKey;

  const [cpuRes, ramRes, diskRes, netRes, infoRes] = await Promise.all([
    fetch(`${base}/api/v1/data?chart=system.cpu&points=1&after=-2`, { headers, signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/v1/data?chart=system.ram&points=1&after=-2`, { headers, signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/v1/data?chart=system.io&points=1&after=-2`, { headers, signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/v1/data?chart=system.net&points=1&after=-2`, { headers, signal: AbortSignal.timeout(5000) }),
    fetch(`${base}/api/v1/info`, { headers, signal: AbortSignal.timeout(5000) }),
  ]);

  const [cpuData, ramData, diskData, netData, info] = await Promise.all([
    cpuRes.json(), ramRes.json(), diskRes.json(), netRes.json(), infoRes.json(),
  ]);

  // CPU: sum all non-idle dimensions
  const cpuDims: Record<string, number> = {};
  if (cpuData.dimension_names && cpuData.data?.[0]) {
    cpuData.dimension_names.forEach((name: string, i: number) => {
      cpuDims[name] = cpuData.data[0][i + 1] ?? 0;
    });
  }
  const cpu = Object.entries(cpuDims)
    .filter(([k]) => k !== "idle" && k !== "iowait")
    .reduce((s, [, v]) => s + v, 0);

  // RAM in bytes
  const ramDims: Record<string, number> = {};
  if (ramData.dimension_names && ramData.data?.[0]) {
    ramData.dimension_names.forEach((name: string, i: number) => {
      ramDims[name] = (ramData.data[0][i + 1] ?? 0) * 1024 * 1024;
    });
  }
  const ramUsed = (ramDims.used ?? 0) + (ramDims.buffers ?? 0) + (ramDims.cached ?? 0);
  const ramTotal = Object.values(ramDims).reduce((s, v) => s + v, 0);

  // Disk I/O kb/s → bytes/s
  const diskDims: Record<string, number> = {};
  if (diskData.dimension_names && diskData.data?.[0]) {
    diskData.dimension_names.forEach((name: string, i: number) => {
      diskDims[name] = Math.abs(diskData.data[0][i + 1] ?? 0) * 1024;
    });
  }

  // Network kb/s → bits/s
  const netDims: Record<string, number> = {};
  if (netData.dimension_names && netData.data?.[0]) {
    netData.dimension_names.forEach((name: string, i: number) => {
      netDims[name] = Math.abs(netData.data[0][i + 1] ?? 0) * 1024 * 8;
    });
  }

  return {
    cpu: Math.round(cpu * 10) / 10,
    ram: { used: ramUsed, total: ramTotal },
    disk: { read: diskDims.in ?? diskDims.read ?? 0, write: diskDims.out ?? diskDims.write ?? 0 },
    net: { received: netDims.received ?? netDims.in ?? 0, sent: netDims.sent ?? netDims.out ?? 0 },
    uptime: info.uptime_seconds ?? 0,
    hostname: info.mirrored_hosts?.[0] ?? info.hostname ?? url,
  };
}
