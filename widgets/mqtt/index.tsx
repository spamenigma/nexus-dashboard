"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { MqttData } from "@/lib/poller/fetchers/mqtt-client";
import type { WidgetProps } from "@/widgets/registry";
import { formatDistanceToNow } from "date-fns";
import { Wifi, WifiOff } from "lucide-react";

export default function MQTTWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<MqttData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an MQTT integration
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
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

  const topics = data?.topics ?? [];
  const connected = data?.connected ?? false;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Connection status */}
      <div className="flex items-center gap-2 text-xs shrink-0">
        {connected
          ? <Wifi size={12} style={{ color: "#22c55e" }} />
          : <WifiOff size={12} style={{ color: "#ef4444" }} />
        }
        <span style={{ color: connected ? "#22c55e" : "#ef4444" }}>
          {connected ? "Connected" : "Disconnected"}
        </span>
        <span style={{ color: "var(--fg-muted)" }}>{topics.length} topic{topics.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Topic list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {topics.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
            {connected ? "Waiting for messages…" : "No messages yet"}
          </p>
        )}
        {topics.map((t) => (
          <div
            key={t.topic}
            className="flex flex-col gap-0.5 px-3 py-2 rounded-lg text-xs"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] truncate flex-1" style={{ color: "var(--accent)" }}>
                {t.topic}
              </span>
              <span className="text-[10px] shrink-0" style={{ color: "var(--fg-muted)" }}>
                {formatDistanceToNow(new Date(t.receivedAt), { addSuffix: true })}
              </span>
            </div>
            <span className="font-mono font-medium truncate">{t.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
