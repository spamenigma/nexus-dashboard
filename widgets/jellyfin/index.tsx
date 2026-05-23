"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { JellyfinData, JellyfinNowPlaying, JellyfinRecentItem } from "@/lib/poller/fetchers/jellyfin";
import type { WidgetProps } from "@/widgets/registry";
import { Play, Pause, Tv, Film } from "lucide-react";

function progressPct(pos: number, runtime: number) {
  return runtime > 0 ? Math.min(100, Math.round((pos / runtime) * 100)) : 0;
}

function NowPlayingCard({ item }: { item: JellyfinNowPlaying }) {
  const pct = progressPct(item.positionTicks, item.runtimeTicks);
  const isEpisode = item.type === "Episode";

  return (
    <div
      className="flex items-start gap-3 p-2 rounded-xl"
      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
    >
      {/* Thumbnail / fallback icon */}
      <div
        className="w-12 h-16 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : isEpisode ? (
          <Tv size={20} style={{ color: "var(--fg-muted)" }} />
        ) : (
          <Film size={20} style={{ color: "var(--fg-muted)" }} />
        )}
      </div>

      <div className="flex flex-col flex-1 min-w-0 gap-1 pt-0.5">
        {/* Title */}
        {isEpisode && item.seriesName && (
          <p className="text-xs font-semibold truncate">{item.seriesName}</p>
        )}
        <p className={`truncate ${isEpisode ? "text-xs" : "text-sm font-semibold"}`} style={{ color: isEpisode ? "var(--fg-muted)" : "var(--fg)" }}>
          {isEpisode
            ? `S${String(item.season ?? 0).padStart(2, "0")}E${String(item.episode ?? 0).padStart(2, "0")} · ${item.title}`
            : item.title}
        </p>

        {/* User + status */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
          <span className="flex items-center gap-1">
            {item.isPaused
              ? <Pause size={10} style={{ color: "var(--accent)" }} />
              : <Play size={10} style={{ color: "#22c55e" }} />}
            {item.isPaused ? "Paused" : "Playing"}
          </span>
          <span>·</span>
          <span className="truncate">{item.userName}</span>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${pct}%`, background: item.isPaused ? "var(--fg-muted)" : "var(--accent)" }}
            />
          </div>
          <span className="text-[10px] tabular-nums shrink-0" style={{ color: "var(--fg-muted)" }}>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function RecentRow({ item }: { item: JellyfinRecentItem }) {
  const isEpisode = item.type === "Episode";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span style={{ color: "var(--fg-muted)" }}>{isEpisode ? <Tv size={11} /> : <Film size={11} />}</span>
      <span className="flex-1 truncate">
        {isEpisode && item.seriesName ? `${item.seriesName} · ` : ""}{item.title}
      </span>
    </div>
  );
}

export default function JellyfinWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<JellyfinData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Jellyfin integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
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

  const { nowPlaying = [], recent = [] } = data ?? {};

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Now playing */}
      {nowPlaying.length > 0 && (
        <div className="flex flex-col gap-2 shrink-0">
          <p className="text-xs uppercase tracking-wider font-medium" style={{ color: "var(--accent)" }}>
            Now Playing
          </p>
          {nowPlaying.map((item, i) => (
            <NowPlayingCard key={i} item={item} />
          ))}
        </div>
      )}

      {/* Recently added */}
      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-hidden">
          <p className="text-xs uppercase tracking-wider font-medium shrink-0" style={{ color: "var(--fg-muted)" }}>
            Recently Added
          </p>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
            {recent.map((item) => (
              <RecentRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {nowPlaying.length === 0 && recent.length === 0 && (
        <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
          Nothing playing right now
        </div>
      )}
    </div>
  );
}
