"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { SABnzbdData, SABnzbdQueueItem } from "@/lib/poller/fetchers/sabnzbd";
import type { WidgetProps } from "@/widgets/registry";
import { Pause, Download } from "lucide-react";

function fmtSpeed(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / (1024 * 1024)).toFixed(1)} GB/s`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB/s`;
  return `${kb.toFixed(0)} KB/s`;
}

function fmtMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
}

function QueueRow({ item }: { item: SABnzbdQueueItem }) {
  const pct = Math.min(100, item.percentage);
  // Trim NZB filename noise (strip extension, replace dots/underscores)
  const name = item.filename.replace(/\.(nzb|mkv|avi|mp4)$/i, "").replace(/[._]/g, " ");
  return (
    <div className="flex flex-col gap-1 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--bg-elevated)" }}>
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate font-medium">{name}</span>
        {item.category && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium shrink-0"
            style={{ background: "var(--accent)20", color: "var(--accent)" }}
          >
            {item.category}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "var(--accent)" }} />
        </div>
        <span className="tabular-nums shrink-0" style={{ color: "var(--fg-muted)" }}>
          {pct.toFixed(0)}% · {item.timeLeft}
        </span>
      </div>
    </div>
  );
}

export default function SABnzbdWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<SABnzbdData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a SABnzbd integration
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

  const { status = "Unknown", speedKB = 0, remainingMB = 0, totalMB = 0, timeLeft = "", paused = false, queue = [] } = data ?? {};
  const overallPct = totalMB > 0 ? Math.round(((totalMB - remainingMB) / totalMB) * 100) : 0;

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Status bar */}
      <div className="flex items-center gap-2 shrink-0">
        {paused
          ? <Pause size={13} style={{ color: "#f59e0b" }} />
          : <Download size={13} style={{ color: "var(--accent)" }} />}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium" style={{ color: paused ? "#f59e0b" : "var(--fg)" }}>
              {paused ? "Paused" : fmtSpeed(speedKB)}
            </span>
            {remainingMB > 0 && (
              <span className="tabular-nums" style={{ color: "var(--fg-muted)" }}>
                {fmtMB(remainingMB)} left · {timeLeft}
              </span>
            )}
          </div>
          {totalMB > 0 && (
            <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${overallPct}%`, background: paused ? "#f59e0b" : "var(--accent)" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Queue list */}
      {queue.length > 0 ? (
        <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
          {queue.map((item) => <QueueRow key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Queue empty
        </div>
      )}
    </div>
  );
}
