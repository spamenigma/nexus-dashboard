export interface SABnzbdQueueItem {
  id: string;
  filename: string;
  category: string;
  status: string;
  percentage: number;
  mbLeft: number;
  mb: number;
  timeLeft: string;
}

export interface SABnzbdData {
  status: string;
  speedKB: number;
  remainingMB: number;
  totalMB: number;
  timeLeft: string;
  paused: boolean;
  queue: SABnzbdQueueItem[];
}

export async function fetchSABnzbd(url: string, apiKey: string): Promise<SABnzbdData> {
  const base = url.replace(/\/$/, "");
  const res = await fetch(`${base}/api?apikey=${apiKey}&output=json&mode=queue`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`SABnzbd responded ${res.status}`);

  const body = await res.json() as { queue?: SABnzbdQueueResponse };
  const q = body.queue;
  if (!q) throw new Error("Unexpected SABnzbd response");

  const queue: SABnzbdQueueItem[] = (q.slots ?? []).map((s) => ({
    id: s.nzo_id,
    filename: s.filename,
    category: s.cat ?? "",
    status: s.status,
    percentage: parseFloat(s.percentage ?? "0"),
    mbLeft: parseFloat(s.mbleft ?? "0"),
    mb: parseFloat(s.mb ?? "0"),
    timeLeft: s.timeleft ?? "",
  }));

  return {
    status: q.status ?? "Unknown",
    speedKB: parseFloat(q.kbpersec ?? "0"),
    remainingMB: parseFloat(q.mbleft ?? "0"),
    totalMB: parseFloat(q.mb ?? "0"),
    timeLeft: q.timeleft ?? "",
    paused: q.status === "Paused",
    queue,
  };
}

interface SABnzbdQueueResponse {
  status?: string;
  speed?: string;
  kbpersec?: string;
  mbleft?: string;
  mb?: string;
  timeleft?: string;
  slots?: {
    nzo_id: string;
    filename: string;
    cat?: string;
    status: string;
    percentage?: string;
    mbleft?: string;
    mb?: string;
    timeleft?: string;
  }[];
}
