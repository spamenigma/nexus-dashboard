"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { JellyseerrData, JellyseerrRequest } from "@/lib/poller/fetchers/jellyseerr";
import type { WidgetProps } from "@/widgets/registry";

const STATUS_META: Record<JellyseerrRequest["status"], { label: string; color: string }> = {
  pending: { label: "Pending", color: "#f59e0b" },
  approved: { label: "Approved", color: "#3b82f6" },
  processing: { label: "Downloading", color: "var(--accent)" },
  available: { label: "Available", color: "#22c55e" },
  declined: { label: "Declined", color: "#ef4444" },
};

function RequestRow({ req }: { req: JellyseerrRequest }) {
  const meta = STATUS_META[req.status] ?? STATUS_META.pending;
  const date = req.requestedAt
    ? new Date(req.requestedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
      style={{ background: "var(--bg-elevated)" }}
    >
      {/* Type pill */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase shrink-0"
        style={{ background: req.type === "movie" ? "#6366f120" : "#8b5cf620", color: req.type === "movie" ? "#818cf8" : "#a78bfa" }}
      >
        {req.type === "movie" ? "Film" : "TV"}
      </span>

      {/* Title + requester */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate">
          {req.title}{req.year ? ` (${req.year})` : ""}
        </span>
        <span className="truncate" style={{ color: "var(--fg-muted)" }}>
          {req.requestedBy} · {date}
        </span>
      </div>

      {/* Status */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0"
        style={{ background: `${meta.color}20`, color: meta.color }}
      >
        {meta.label}
      </span>
    </div>
  );
}

export default function JellyseerrWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const showFilter = (config.filter as string) ?? "all";
  const { data, error, loading } = useIntegrationData<JellyseerrData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Jellyseerr integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
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

  const allRequests = data?.requests ?? [];
  const requests = showFilter === "pending"
    ? allRequests.filter((r) => r.status === "pending")
    : allRequests;

  const pendingCount = data?.pendingCount ?? 0;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <span style={{ color: "var(--fg-muted)" }}>{allRequests.length} requests</span>
        {pendingCount > 0 && (
          <span className="font-semibold" style={{ color: "#f59e0b" }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Request list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {requests.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
            No requests
          </p>
        )}
        {requests.map((req) => <RequestRow key={req.id} req={req} />)}
      </div>
    </div>
  );
}
