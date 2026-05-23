export interface SonarrQueueItem {
  id: number;
  seriesTitle: string;
  episodeTitle: string;
  season: number;
  episode: number;
  quality: string;
  size: number;
  sizeleft: number;
  status: string;
  eta?: string;
}

export interface SonarrCalendarItem {
  id: number;
  seriesTitle: string;
  episodeTitle: string;
  season: number;
  episode: number;
  airDate: string;
  hasFile: boolean;
}

export interface SonarrData {
  queue: SonarrQueueItem[];
  calendar: SonarrCalendarItem[];
}

export async function fetchSonarr(url: string, apiKey: string): Promise<SonarrData> {
  const base = url.replace(/\/$/, "");
  const headers = { "X-Api-Key": apiKey };

  const today = new Date().toISOString().split("T")[0];
  const inSevenDays = new Date(Date.now() + 7 * 86_400_000).toISOString().split("T")[0];

  const [queueRes, calRes] = await Promise.all([
    fetch(`${base}/api/v3/queue?pageSize=20`, { headers, signal: AbortSignal.timeout(8000) }),
    fetch(`${base}/api/v3/calendar?start=${today}&end=${inSevenDays}&unmonitored=false`, { headers, signal: AbortSignal.timeout(8000) }),
  ]);

  if (!queueRes.ok) throw new Error(`Sonarr responded ${queueRes.status}`);

  const queueData = await queueRes.json() as { records?: SonarrQueueRecord[] };
  const queue: SonarrQueueItem[] = (queueData.records ?? []).map((r) => ({
    id: r.id,
    seriesTitle: r.series?.title ?? "Unknown",
    episodeTitle: r.episode?.title ?? "",
    season: r.episode?.seasonNumber ?? 0,
    episode: r.episode?.episodeNumber ?? 0,
    quality: r.quality?.quality?.name ?? "Unknown",
    size: r.size ?? 0,
    sizeleft: r.sizeleft ?? 0,
    status: r.status ?? "unknown",
    eta: r.estimatedCompletionTime,
  }));

  let calendar: SonarrCalendarItem[] = [];
  if (calRes.ok) {
    const calData = await calRes.json() as SonarrCalendarRecord[];
    calendar = calData.map((ep) => ({
      id: ep.id,
      seriesTitle: ep.series?.title ?? "Unknown",
      episodeTitle: ep.title ?? "",
      season: ep.seasonNumber,
      episode: ep.episodeNumber,
      airDate: ep.airDate,
      hasFile: ep.hasFile ?? false,
    }));
  }

  return { queue, calendar };
}

interface SonarrQueueRecord {
  id: number;
  series?: { title: string };
  episode?: { title: string; seasonNumber: number; episodeNumber: number };
  quality?: { quality: { name: string } };
  size?: number;
  sizeleft?: number;
  status?: string;
  estimatedCompletionTime?: string;
}

interface SonarrCalendarRecord {
  id: number;
  title?: string;
  seasonNumber: number;
  episodeNumber: number;
  airDate: string;
  hasFile?: boolean;
  series?: { title: string };
}
