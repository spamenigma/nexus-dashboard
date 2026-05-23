"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { CloudflareData } from "@/lib/poller/fetchers/cloudflare";
import type { WidgetProps } from "@/widgets/registry";
import { CheckCircle, XCircle, Cloud } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CloudflareWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<CloudflareData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Cloudflare integration
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
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

  return (
    <div className="flex flex-col h-full gap-3 justify-center">
      {/* Status */}
      <div className="flex items-center gap-2">
        {data?.inSync
          ? <CheckCircle size={18} style={{ color: "#22c55e" }} />
          : <XCircle size={18} style={{ color: "#ef4444" }} />
        }
        <span className="font-semibold text-sm">
          {data?.inSync ? "DNS in sync" : "DNS mismatch"}
        </span>
      </div>

      {/* Record name */}
      {data?.recordName && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--fg-muted)" }}>
          <Cloud size={12} />
          <span className="truncate">{data.recordName}</span>
        </div>
      )}

      {/* IPs */}
      <div
        className="flex flex-col gap-1.5 rounded-xl p-3 text-xs"
        style={{ background: "var(--bg-elevated)" }}
      >
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--fg-muted)" }}>DNS record</span>
          <span className="font-mono font-medium">{data?.recordIp ?? "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ color: "var(--fg-muted)" }}>Public IP</span>
          <span className="font-mono font-medium">{data?.publicIp ?? "—"}</span>
        </div>
      </div>

      {/* Last update */}
      {data?.lastModified && (
        <p className="text-[10px] text-center" style={{ color: "var(--fg-muted)" }}>
          Record updated {formatDistanceToNow(new Date(data.lastModified), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
