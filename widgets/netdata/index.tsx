"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { NetdataStats } from "@/lib/poller/fetchers/netdata";
import type { WidgetProps } from "@/widgets/registry";

function fmtBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const k = 1024;
  const s = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${s[i]}`;
}

function fmtBits(bits: number): string {
  if (!bits || bits <= 0) return "0 bps";
  if (bits < 1_000) return `${bits.toFixed(0)} bps`;
  if (bits < 1_000_000) return `${(bits / 1_000).toFixed(1)} Kbps`;
  if (bits < 1_000_000_000) return `${(bits / 1_000_000).toFixed(1)} Mbps`;
  return `${(bits / 1_000_000_000).toFixed(2)} Gbps`;
}

function fmtUptime(secs: number): string {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct > 85 ? "#ef4444" : pct > 70 ? "#f59e0b" : "var(--accent)";
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

export default function NetdataWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<NetdataStats>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Netdata integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-1 justify-center h-full">
        {[1, 2, 3, 4].map((i) => (
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

  if (!data) return null;

  const ramPct = data.ram.total > 0 ? Math.round((data.ram.used / data.ram.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2.5 h-full justify-center">
      {/* Host + uptime header */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
          {data.hostname}
        </span>
        <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>
          up {fmtUptime(data.uptime)}
        </span>
      </div>

      {/* CPU */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--fg-muted)" }}>CPU</span>
          <span className="font-mono font-medium tabular-nums">{data.cpu.toFixed(1)}%</span>
        </div>
        <Bar value={data.cpu} max={100} />
      </div>

      {/* RAM */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--fg-muted)" }}>RAM</span>
          <span className="font-mono font-medium tabular-nums">
            {fmtBytes(data.ram.used)} / {fmtBytes(data.ram.total)}{" "}
            <span style={{ color: "var(--fg-muted)" }}>({ramPct}%)</span>
          </span>
        </div>
        <Bar value={data.ram.used} max={data.ram.total} />
      </div>

      {/* Disk + Net grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
        <div className="flex items-center justify-between gap-1">
          <span style={{ color: "var(--fg-muted)" }}>Disk R</span>
          <span className="font-mono tabular-nums">{fmtBytes(data.disk.read)}/s</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span style={{ color: "var(--fg-muted)" }}>Net ↓</span>
          <span className="font-mono tabular-nums">{fmtBits(data.net.received)}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span style={{ color: "var(--fg-muted)" }}>Disk W</span>
          <span className="font-mono tabular-nums">{fmtBytes(data.disk.write)}/s</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span style={{ color: "var(--fg-muted)" }}>Net ↑</span>
          <span className="font-mono tabular-nums">{fmtBits(data.net.sent)}</span>
        </div>
      </div>
    </div>
  );
}
