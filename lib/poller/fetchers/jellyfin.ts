export interface JellyfinNowPlaying {
  userName: string;
  title: string;
  type: string;
  seriesName?: string;
  season?: number;
  episode?: number;
  runtimeTicks: number;
  positionTicks: number;
  isPaused: boolean;
  imageUrl?: string;
}

export interface JellyfinRecentItem {
  id: string;
  title: string;
  type: string;
  seriesName?: string;
  dateCreated: string;
  imageUrl?: string;
}

export interface JellyfinData {
  nowPlaying: JellyfinNowPlaying[];
  recent: JellyfinRecentItem[];
}

export async function fetchJellyfin(url: string, apiKey: string): Promise<JellyfinData> {
  const base = url.replace(/\/$/, "");
  const headers = { "X-Emby-Token": apiKey };
  const sig = AbortSignal.timeout(8000);

  const [sessionsRes, recentRes] = await Promise.all([
    fetch(`${base}/Sessions?ActiveWithinSeconds=960`, { headers, signal: sig }),
    fetch(
      `${base}/Items?SortBy=DateCreated&SortOrder=Descending&Recursive=true` +
      `&IncludeItemTypes=Movie,Episode&Limit=10&Fields=DateCreated,SeriesName,ParentIndexNumber,IndexNumber`,
      { headers, signal: sig }
    ),
  ]);

  if (!sessionsRes.ok) throw new Error(`Jellyfin responded ${sessionsRes.status}`);

  const sessions = await sessionsRes.json() as JellyfinSessionResponse[];

  const nowPlaying: JellyfinNowPlaying[] = sessions
    .filter((s) => s.NowPlayingItem)
    .map((s) => ({
      userName: s.UserName ?? "Unknown",
      title: s.NowPlayingItem!.Name ?? "",
      type: s.NowPlayingItem!.Type ?? "",
      seriesName: s.NowPlayingItem!.SeriesName,
      season: s.NowPlayingItem!.ParentIndexNumber,
      episode: s.NowPlayingItem!.IndexNumber,
      runtimeTicks: s.NowPlayingItem!.RunTimeTicks ?? 0,
      positionTicks: s.PlayState?.PositionTicks ?? 0,
      isPaused: s.PlayState?.IsPaused ?? false,
      imageUrl: `${base}/Items/${s.NowPlayingItem!.Id}/Images/Primary?api_key=${apiKey}&maxHeight=120&quality=80`,
    }));

  let recent: JellyfinRecentItem[] = [];
  if (recentRes.ok) {
    const recentData = await recentRes.json() as { Items?: JellyfinItemResponse[] };
    recent = (recentData.Items ?? []).map((item) => ({
      id: item.Id,
      title: item.Name,
      type: item.Type,
      seriesName: item.SeriesName,
      dateCreated: item.DateCreated ?? "",
      imageUrl: `${base}/Items/${item.Id}/Images/Primary?api_key=${apiKey}&maxHeight=80&quality=70`,
    }));
  }

  return { nowPlaying, recent };
}

interface JellyfinSessionResponse {
  UserName?: string;
  NowPlayingItem?: {
    Id: string;
    Name: string;
    Type: string;
    SeriesName?: string;
    ParentIndexNumber?: number;
    IndexNumber?: number;
    RunTimeTicks?: number;
  } | null;
  PlayState?: {
    PositionTicks?: number;
    IsPaused?: boolean;
  };
}

interface JellyfinItemResponse {
  Id: string;
  Name: string;
  Type: string;
  SeriesName?: string;
  DateCreated?: string;
}
