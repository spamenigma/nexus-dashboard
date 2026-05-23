export interface RadarrQueueItem {
  id: number;
  title: string;
  quality: string;
  size: number;
  sizeleft: number;
  status: string;
  eta?: string;
}

export interface RadarrCalendarItem {
  id: number;
  title: string;
  year: number;
  releaseDate: string;
  hasFile: boolean;
}

export interface RadarrData {
  queue: RadarrQueueItem[];
  calendar: RadarrCalendarItem[];
}

export async function fetchRadarr(url: string, apiKey: string): Promise<RadarrData> {
  const base = url.replace(/\/$/, "");
  const headers = { "X-Api-Key": apiKey };

  const today = new Date().toISOString().split("T")[0];
  const inSevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];

  const [queueRes, calRes] = await Promise.all([
    fetch(`${base}/api/v3/queue?pageSize=20`, { headers, signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/api/v3/calendar?start=${today}&end=${inSevenDays}&unmonitored=false`, { headers, signal: AbortSignal.timeout(8000) }),
  ]);

  if (!queueRes.ok) throw new Error(`Radarr responded ${queueRes.status}`);

  const queueData = await queueRes.json() as { records?: RadarrQueueRecord[] };
  const queue: RadarrQueueItem[] = (queueData.records ?? []).map((r) => ({
    id: r.id,
    title: r.movie?.title ?? r.title ?? "Unknown",
    quality: r.quality?.quality?.name ?? "Unknown",
    size: r.size ?? 0,
    sizeleft: r.sizeleft ?? 0,
    status: r.status ?? "unknown",
    eta: r.estimatedCompletionTime,
  }));

  let calendar: RadarrCalendarItem[] = [];
  if (calRes.ok) {
    const calData = await calRes.json() as RadarrCalendarRecord[];
    calendar = calData.map((m) => ({
      id: m.id,
      title: m.title,
      year: m.year,
      releaseDate: m.digitalRelease ?? m.physicalRelease ?? m.inCinemas ?? "",
      hasFile: m.hasFile ?? false,
    }));
  }

  return { queue, calendar };
}

interface RadarrQueueRecord {
  id: number;
  title?: string;
  movie?: { title: string };
  quality?: { quality: { name: string } };
  size?: number;
  sizeleft?: number;
  status?: string;
  estimatedCompletionTime?: string;
}

interface RadarrCalendarRecord {
  id: number;
  title: string;
  year: number;
  physicalRelease?: string;
  digitalRelease?: string;
  inCinemas?: string;
  hasFile?: boolean;
}
