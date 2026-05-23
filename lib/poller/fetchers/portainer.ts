export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: "running" | "stopped" | "paused" | "restarting" | "unknown";
  statusText: string;
  stack?: string;
  cpu: number;    // percent
  memory: number; // bytes
  memoryLimit: number;
}

export async function fetchPortainerContainers(url: string, token: string, endpointId = 1): Promise<DockerContainer[]> {
  const base = url.replace(/\/$/, "");
  const headers = { "X-API-Key": token };

  const res = await fetch(`${base}/api/endpoints/${endpointId}/docker/containers/json?all=true`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Portainer responded ${res.status}`);

  const containers: PortainerContainer[] = await res.json();

  return containers.map((c) => ({
    id: c.Id.slice(0, 12),
    name: (c.Names[0] ?? "").replace(/^\//, ""),
    image: c.Image.split(":")[0].split("/").pop() ?? c.Image,
    status: mapStatus(c.State),
    statusText: c.Status,
    stack: c.Labels?.["com.docker.compose.project"],
    cpu: 0,
    memory: 0,
    memoryLimit: 0,
  }));
}

export async function portainerAction(
  url: string, token: string, containerId: string, action: "start" | "stop" | "restart", endpointId = 1
): Promise<void> {
  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/api/endpoints/${endpointId}/docker/containers/${containerId}/${action}`, {
    method: "POST",
    headers: { "X-API-Key": token },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok && res.status !== 304) throw new Error(`Action failed: ${res.status}`);
}

function mapStatus(state: string): DockerContainer["status"] {
  switch (state) {
    case "running": return "running";
    case "exited": case "dead": case "created": return "stopped";
    case "paused": return "paused";
    case "restarting": return "restarting";
    default: return "unknown";
  }
}

interface PortainerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Labels?: Record<string, string>;
}
