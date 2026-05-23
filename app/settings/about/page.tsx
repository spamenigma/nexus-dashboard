"use client";
import { trpc } from "@/lib/trpc/client";

function fmt(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

export default function AboutPage() {
  const { data } = trpc.settings.getAbout.useQuery();

  const stats = data
    ? [
        { label: "Version", value: `v${data.version}` },
        { label: "Node.js", value: data.nodeVersion },
        { label: "Process uptime", value: fmt(data.uptime) },
        { label: "Pages", value: String(data.pageCount) },
        { label: "Widgets", value: String(data.widgetCount) },
        { label: "Integrations", value: String(data.integrationCount) },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">About</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>System information and version details.</p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        {stats.length === 0
          ? <div className="p-6"><div className="skeleton h-4 w-32 rounded" /></div>
          : stats.map(({ label, value }, i) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3 text-sm"
              style={{ borderBottom: i < stats.length - 1 ? "1px solid var(--border)" : "none" }}
            >
              <span style={{ color: "var(--fg-muted)" }}>{label}</span>
              <span className="font-mono font-medium">{value}</span>
            </div>
          ))
        }
      </div>

      <div className="text-xs text-center" style={{ color: "var(--fg-muted)" }}>
        Nexus Dashboard — built for mimas &amp; tethys
      </div>
    </div>
  );
}
