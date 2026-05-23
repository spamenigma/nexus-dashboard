// Calls Docker's system/df API (expose Docker daemon on TCP: -H tcp://0.0.0.0:2375)
export interface DokuData {
  images: { total: number; size: number; reclaimable: number };
  containers: { total: number; size: number };
  volumes: { total: number; size: number };
  buildCache: { total: number; size: number };
}

interface DockerImage { Size: number; Containers: number }
interface DockerContainer { SizeRootFs?: number }
interface DockerVolume { UsageData?: { Size: number } }
interface DockerBuildCache { Size: number }

interface DfResponse {
  Images?: DockerImage[];
  Containers?: DockerContainer[];
  Volumes?: DockerVolume[];
  BuildCache?: DockerBuildCache[];
}

export async function fetchDoku(url: string): Promise<DokuData> {
  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/system/df`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json() as DfResponse;

  const images = data.Images ?? [];
  const containers = data.Containers ?? [];
  const volumes = data.Volumes ?? [];
  const buildCache = data.BuildCache ?? [];

  return {
    images: {
      total: images.length,
      size: images.reduce((s, i) => s + i.Size, 0),
      reclaimable: images.filter((i) => i.Containers === 0).reduce((s, i) => s + i.Size, 0),
    },
    containers: {
      total: containers.length,
      size: containers.reduce((s, c) => s + (c.SizeRootFs ?? 0), 0),
    },
    volumes: {
      total: volumes.length,
      size: volumes.reduce((s, v) => s + (v.UsageData?.Size ?? 0), 0),
    },
    buildCache: {
      total: buildCache.length,
      size: buildCache.reduce((s, b) => s + b.Size, 0),
    },
  };
}
