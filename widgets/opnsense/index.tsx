"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { OPNsenseData, OPNsenseGateway } from "@/lib/poller/fetchers/opnsense";
import type { WidgetProps } from "@/widgets/registry";

const STATUS_COLORS: Record<OPNsenseGateway["status"], string> = {
  online: "#22c55e",
  offline: "#ef4444",
  loss: "#f97316",
  delay: "#eab308",
  unknown: "var(--fg-muted)",
};

function GatewayRow({ gw }: { gw: OPNsenseGateway }) {
  const color = STATUS_COLORS[gw.status];
  const isOnline = gw.status === "online";
  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs"
      style={{ background: "var(--bg-elevated)" }}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{
          background: color,
          boxShadow: isOnline ? `0 0 6px ${color}80` : undefined,
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{gw.name}</p>
        {gw.address && <p className="font-mono text-[10px]" style={{ color: "var(--fg-muted)" }}>{gw.address}</p>}
      </div>
      <div className="text-right shrink-0" style={{ color: "var(--fg-muted)" }}>
        {isOnline ? (
          <div className="flex items-center gap-2 tabular-nums">
            <span>{gw.delay}ms</span>
            <span style={{ color: gw.loss !== "0.0%" ? "#f97316" : "var(--fg-muted)" }}>{gw.loss} loss</span>
          </div>
        ) : (
          <span style={{ color }}>{gw.statusTranslated}</span>
        )}
      </div>
    </div>
  );
}

export default function OPNsenseWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<OPNsenseData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an OPNsense integration
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
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

  const gateways = data?.gateways ?? [];
  const allOnline = gateways.every((g) => g.status === "online");

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center gap-2 text-xs shrink-0">
        <span className="font-semibold" style={{ color: allOnline ? "#22c55e" : "#ef4444" }}>
          {allOnline ? "All gateways online" : "Gateway issue"}
        </span>
        <span style={{ color: "var(--fg-muted)" }}>{gateways.length} gateway{gateways.length !== 1 ? "s" : ""}</span>
      </div>
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {gateways.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>No gateway data</p>
        )}
        {gateways.map((gw) => <GatewayRow key={gw.name} gw={gw} />)}
      </div>
    </div>
  );
}
