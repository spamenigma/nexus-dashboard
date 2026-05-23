"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { DokuData } from "@/lib/poller/fetchers/doku";
import type { WidgetProps } from "@/widgets/registry";
import { HardDrive } from "lucide-react";

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const gb = 1024 ** 3;
  const mb = 1024 ** 2;
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface Row { label: string; total: number; size: number; reclaimable?: number }

function DiskRow({ label, total, size, reclaimable }: Row) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
      style={{ background: "var(--bg-elevated)" }}
    >
      <div className="flex items-center gap-2">
        <HardDrive size={11} style={{ color: "var(--accent)" }} />
        <span className="font-medium">{label}</span>
        <span style={{ color: "var(--fg-muted)" }}>×{total}</span>
      </div>
      <div className="flex items-center gap-2 tabular-nums">
        <span className="font-medium">{fmtBytes(size)}</span>
        {reclaimable !== undefined && reclaimable > 0 && (
          <span className="text-[10px]" style={{ color: "#f97316" }}>
            {fmtBytes(reclaimable)} reclaimable
          </span>
        )}
      </div>
    </div>
  );
}

export default function DokuWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<DokuData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Docker (Doku) integration
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
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

  const total = (data?.images.size ?? 0) + (data?.containers.size ?? 0) + (data?.volumes.size ?? 0) + (data?.buildCache.size ?? 0);

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between text-xs shrink-0">
        <span style={{ color: "var(--fg-muted)" }}>Total disk usage</span>
        <span className="font-semibold">{fmtBytes(total)}</span>
      </div>
      <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0">
        {data && (
          <>
            <DiskRow label="Images" total={data.images.total} size={data.images.size} reclaimable={data.images.reclaimable} />
            <DiskRow label="Containers" total={data.containers.total} size={data.containers.size} />
            <DiskRow label="Volumes" total={data.volumes.total} size={data.volumes.size} />
            <DiskRow label="Build cache" total={data.buildCache.total} size={data.buildCache.size} reclaimable={data.buildCache.size} />
          </>
        )}
      </div>
    </div>
  );
}
