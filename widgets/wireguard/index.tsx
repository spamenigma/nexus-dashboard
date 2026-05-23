"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { WireGuardData, WireGuardPeer } from "@/lib/poller/fetchers/wireguard";
import type { WidgetProps } from "@/widgets/registry";
import { formatDistanceToNow } from "date-fns";

function fmtBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;
  const kb = 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(0)} MB`;
  if (bytes >= kb) return `${(bytes / kb).toFixed(0)} KB`;
  return `${bytes} B`;
}

function PeerRow({ peer }: { peer: WireGuardPeer }) {
  const lastSeen = peer.latestHandshakeAt
    ? formatDistanceToNow(new Date(peer.latestHandshakeAt), { addSuffix: true })
    : "Never";

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
      style={{ background: "var(--bg-elevated)", opacity: peer.enabled ? 1 : 0.5 }}
    >
      {/* Online dot */}
      <span
        className={`w-2 h-2 rounded-full shrink-0${peer.isOnline ? " status-dot ok" : ""}`}
        style={{ background: peer.isOnline ? "#22c55e" : "#6b7280" }}
      />

      {/* Name + address */}
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-medium truncate">{peer.name}</span>
        <span className="text-[10px] truncate" style={{ color: "var(--fg-muted)" }}>
          {peer.address}
        </span>
      </div>

      {/* Last seen + transfer */}
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="tabular-nums" style={{ color: peer.isOnline ? "#22c55e" : "var(--fg-muted)" }}>
          {peer.isOnline ? "Online" : lastSeen}
        </span>
        {(peer.transferRxBytes > 0 || peer.transferTxBytes > 0) && (
          <span className="text-[10px] tabular-nums" style={{ color: "var(--fg-muted)" }}>
            ↓{fmtBytes(peer.transferRxBytes)} ↑{fmtBytes(peer.transferTxBytes)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function WireGuardWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<WireGuardData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a WireGuard Easy integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
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

  const { peers = [], onlineCount = 0, totalCount = 0 } = data ?? {};

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <span className="font-semibold" style={{ color: onlineCount > 0 ? "#22c55e" : "var(--fg-muted)" }}>
          {onlineCount} online
        </span>
        <span style={{ color: "var(--fg-muted)" }}>{totalCount} peers</span>
      </div>

      {/* Peer list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {peers.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>No peers configured</p>
        )}
        {peers
          .sort((a, b) => Number(b.isOnline) - Number(a.isOnline))
          .map((peer) => <PeerRow key={peer.id} peer={peer} />)}
      </div>
    </div>
  );
}
