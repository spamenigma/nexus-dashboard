"use client";
import { useState } from "react";
import { Play, Square, RotateCcw, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { DockerContainer } from "@/lib/poller/fetchers/portainer";
import type { WidgetProps } from "@/widgets/registry";

const STATUS_COLOR: Record<string, string> = {
  running: "#22c55e",
  stopped: "#ef4444",
  paused: "#f59e0b",
  restarting: "#3b82f6",
  unknown: "#6b7280",
};

export default function PortainerWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const showStopped = config.showStopped !== false;
  const { data, error, loading } = useIntegrationData<DockerContainer[]>(integrationId);
  const [pending, setPending] = useState<string | null>(null);

  async function doAction(containerId: string, action: "start" | "stop" | "restart") {
    if (!integrationId) return;
    setPending(containerId + action);
    try {
      await fetch(`/api/integration/${integrationId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target: containerId }),
      });
    } finally {
      setPending(null);
    }
  }

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Portainer integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 h-full justify-center">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-9 rounded-lg" />
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

  const containers = (data ?? []).filter((c) => showStopped || c.status === "running");
  const runningCount = containers.filter((c) => c.status === "running").length;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <span className="font-semibold" style={{ color: "#22c55e" }}>
          {runningCount} running
        </span>
        {containers.length - runningCount > 0 && (
          <span className="font-semibold" style={{ color: "#ef4444" }}>
            {containers.length - runningCount} stopped
          </span>
        )}
        <span style={{ color: "var(--fg-muted)" }}>{containers.length} total</span>
      </div>

      {/* Container rows */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {containers.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
            No containers
          </p>
        )}
        {containers.map((c) => {
          const isRunning = c.status === "running";
          return (
            <div
              key={c.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--bg-elevated)" }}
            >
              {/* Status dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  background: STATUS_COLOR[c.status] ?? STATUS_COLOR.unknown,
                  boxShadow: c.status === "restarting" ? "0 0 6px #3b82f6" : undefined,
                }}
              />

              {/* Name + stack */}
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium truncate">{c.name}</span>
                {c.stack && (
                  <span className="text-[10px] truncate" style={{ color: "var(--fg-muted)" }}>
                    {c.stack}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 shrink-0">
                {!isRunning && (
                  <ActionBtn
                    icon={<Play size={11} />}
                    title="Start"
                    loading={pending === c.id + "start"}
                    onClick={() => doAction(c.id, "start")}
                    hoverColor="#22c55e"
                  />
                )}
                {isRunning && (
                  <ActionBtn
                    icon={<Square size={11} />}
                    title="Stop"
                    loading={pending === c.id + "stop"}
                    onClick={() => {
                      if (window.confirm(`Stop ${c.name}?`)) doAction(c.id, "stop");
                    }}
                    hoverColor="#ef4444"
                  />
                )}
                <ActionBtn
                  icon={<RotateCcw size={11} />}
                  title="Restart"
                  loading={pending === c.id + "restart"}
                  onClick={() => {
                    if (window.confirm(`Restart ${c.name}?`)) doAction(c.id, "restart");
                  }}
                  hoverColor="#3b82f6"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({
  icon, title, loading, onClick, hoverColor,
}: {
  icon: ReactNode;
  title: string;
  loading: boolean;
  onClick: () => void;
  hoverColor: string;
}) {
  return (
    <button
      title={title}
      disabled={loading}
      onClick={onClick}
      className="p-1 rounded transition-colors hover:bg-white/10 disabled:opacity-50"
      style={{ color: "var(--fg-muted)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = hoverColor; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-muted)"; }}
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : icon}
    </button>
  );
}
