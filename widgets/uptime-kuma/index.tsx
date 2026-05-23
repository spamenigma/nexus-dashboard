"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { UptimeMonitor } from "@/lib/poller/fetchers/uptime-kuma";
import type { WidgetProps } from "@/widgets/registry";

const STATUS_COLOR: Record<string, string> = {
  up: "#22c55e",
  down: "#ef4444",
  pending: "#f59e0b",
  unknown: "#6b7280",
};

export default function UptimeKumaWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const maxItems = (config.maxItems as number) ?? 30;
  const showResponseTime = config.showResponseTime !== false;
  const { data, error, loading } = useIntegrationData<UptimeMonitor[]>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an Uptime Kuma integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 h-full justify-center">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton h-7 rounded-lg" />
        ))}
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

  const monitors = (data ?? []).slice(0, maxItems);
  const downCount = monitors.filter((m) => m.status === "down").length;
  const upCount = monitors.filter((m) => m.status === "up").length;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <span className="font-semibold" style={{ color: "#22c55e" }}>
          {upCount} up
        </span>
        {downCount > 0 && (
          <span className="font-semibold" style={{ color: "#ef4444" }}>
            {downCount} down
          </span>
        )}
        <span style={{ color: "var(--fg-muted)" }}>{monitors.length} monitors</span>
      </div>

      {/* Monitor rows */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {monitors.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
            No monitors found
          </p>
        )}
        {monitors.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
            style={{ background: "var(--bg-elevated)" }}
          >
            {/* Status dot — pulses on down */}
            <span
              className={`w-2 h-2 rounded-full shrink-0${m.status === "down" ? " status-dot error" : ""}`}
              style={{
                background: STATUS_COLOR[m.status] ?? STATUS_COLOR.unknown,
                boxShadow: m.status === "down" ? "0 0 6px #ef4444" : undefined,
              }}
            />

            {/* Name */}
            <span className="flex-1 truncate font-medium">{m.name}</span>

            {/* Response time */}
            {showResponseTime && m.responseMs > 0 && (
              <span className="tabular-nums shrink-0" style={{ color: "var(--fg-muted)" }}>
                {m.responseMs}ms
              </span>
            )}

            {/* Uptime % */}
            <span
              className="tabular-nums font-semibold w-14 text-right shrink-0"
              style={{
                color:
                  m.uptime24h >= 99 ? "#22c55e"
                    : m.uptime24h >= 95 ? "#f59e0b"
                    : "#ef4444",
              }}
            >
              {m.uptime24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
