"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { SonarrData, SonarrQueueItem, SonarrCalendarItem } from "@/lib/poller/fetchers/sonarr";
import type { WidgetProps } from "@/widgets/registry";
import { Download, Calendar } from "lucide-react";

function fmtBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const g = 1024 * 1024 * 1024;
  if (bytes >= g) return `${(bytes / g).toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

function epCode(season: number, episode: number) {
  return `S${String(season).padStart(2, "0")}E${String(episode).padStart(2, "0")}`;
}

function QueueRow({ item }: { item: SonarrQueueItem }) {
  const total = item.size || 1;
  const done = total - item.sizeleft;
  const pct = Math.min(100, Math.round((done / total) * 100));

  return (
    <div className="flex flex-col gap-1 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--bg-elevated)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate flex-1">{item.seriesTitle}</span>
        <span className="shrink-0 tabular-nums" style={{ color: "var(--fg-muted)" }}>{epCode(item.season, item.episode)} · {pct}%</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
        </div>
        <span className="tabular-nums shrink-0" style={{ color: "var(--fg-muted)" }}>
          {fmtBytes(done)} / {fmtBytes(total)}
        </span>
      </div>
    </div>
  );
}

function CalendarRow({ item }: { item: SonarrCalendarItem }) {
  const date = item.airDate
    ? new Date(item.airDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "TBD";
  return (
    <div className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
      <span className="tabular-nums shrink-0 font-medium w-12 text-right" style={{ color: "var(--accent)" }}>{date}</span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate">{item.seriesTitle}</span>
        <span className="truncate" style={{ color: "var(--fg-muted)" }}>
          {epCode(item.season, item.episode)}{item.episodeTitle ? ` · ${item.episodeTitle}` : ""}
        </span>
      </div>
    </div>
  );
}

export default function SonarrWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<SonarrData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Sonarr integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-lg" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-sm px-3 text-center" style={{ color: "#ef4444" }}>
        {error}
      </div>
    );
  }

  const { queue = [], calendar = [] } = data ?? {};

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Downloading */}
      {queue.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium" style={{ color: "var(--accent)" }}>
            <Download size={11} /> Downloading ({queue.length})
          </div>
          {queue.map((item) => <QueueRow key={item.id} item={item} />)}
        </div>
      )}

      {/* Upcoming */}
      {calendar.length > 0 && (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-medium shrink-0" style={{ color: "var(--fg-muted)" }}>
            <Calendar size={11} /> Airing this week
          </div>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            {calendar.map((item) => <CalendarRow key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {queue.length === 0 && calendar.length === 0 && (
        <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
          Queue empty · nothing airing this week
        </div>
      )}
    </div>
  );
}
