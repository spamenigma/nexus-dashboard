export interface JellyseerrRequest {
  id: number;
  type: "movie" | "tv";
  status: "pending" | "approved" | "declined" | "available" | "processing";
  title: string;
  year?: number;
  requestedBy: string;
  requestedAt: string;
  posterUrl?: string;
}

export interface JellyseerrData {
  requests: JellyseerrRequest[];
  pendingCount: number;
}

export async function fetchJellyseerr(url: string, apiKey: string): Promise<JellyseerrData> {
  const base = url.replace(/\/$/, "");
  const headers = { "X-Api-Key": apiKey };

  const res = await fetch(`${base}/api/v1/request?take=20&skip=0&sort=added&filter=all`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Jellyseerr responded ${res.status}`);

  const data = await res.json() as JellyseerrResponse;

  const requests: JellyseerrRequest[] = (data.results ?? []).map((r) => {
    const media = r.media;
    const title =
      media?.title ?? media?.name ?? media?.originalTitle ?? media?.originalName ?? "Unknown";
    const year = media?.releaseDate
      ? new Date(media.releaseDate).getFullYear()
      : media?.firstAirDate
      ? new Date(media.firstAirDate).getFullYear()
      : undefined;

    return {
      id: r.id,
      type: r.type,
      status: mapStatus(r.status),
      title,
      year,
      requestedBy: r.requestedBy?.displayName ?? r.requestedBy?.username ?? "Unknown",
      requestedAt: r.createdAt,
      posterUrl: media?.posterPath
        ? `https://image.tmdb.org/t/p/w92${media.posterPath}`
        : undefined,
    };
  });

  return {
    requests,
    pendingCount: requests.filter((r) => r.status === "pending").length,
  };
}

function mapStatus(code: number): JellyseerrRequest["status"] {
  switch (code) {
    case 1: return "pending";
    case 2: return "approved";
    case 3: return "declined";
    case 4: return "available";
    case 5: return "processing";
    default: return "pending";
  }
}

interface JellyseerrResponse {
  results?: {
    id: number;
    type: "movie" | "tv";
    status: number;
    requestedBy?: { displayName?: string; username?: string };
    createdAt: string;
    media?: {
      title?: string;
      name?: string;
      originalTitle?: string;
      originalName?: string;
      releaseDate?: string;
      firstAirDate?: string;
      posterPath?: string;
    };
  }[];
}
