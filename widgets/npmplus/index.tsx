"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { NPMData, NPMProxyHost } from "@/lib/poller/fetchers/npmplus";
import type { WidgetProps } from "@/widgets/registry";
import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";

function certStatus(days?: number): { icon: typeof ShieldCheck; color: string; label: string } {
  if (days === undefined) return { icon: Shield, color: "var(--fg-muted)", label: "No SSL" };
  if (days < 0) return { icon: ShieldAlert, color: "#ef4444", label: "Expired" };
  if (days < 7) return { icon: ShieldAlert, color: "#ef4444", label: `${days}d` };
  if (days < 30) return { icon: ShieldAlert, color: "#f59e0b", label: `${days}d` };
  return { icon: ShieldCheck, color: "#22c55e", label: `${days}d` };
}

function HostRow({ host }: { host: NPMProxyHost }) {
  const primary = host.domains[0] ?? "Unknown";
  const extra = host.domains.length > 1 ? `+${host.domains.length - 1}` : null;
  const cert = certStatus(host.daysUntilExpiry);
  const CertIcon = cert.icon;

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
      style={{
        background: "var(--bg-elevated)",
        opacity: host.enabled ? 1 : 0.5,
      }}
    >
      {/* Enabled dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: host.enabled ? "#22c55e" : "#6b7280" }}
      />

      {/* Domain */}
      <span className="flex-1 truncate font-medium">{primary}</span>
      {extra && (
        <span className="text-[10px] shrink-0" style={{ color: "var(--fg-muted)" }}>{extra}</span>
      )}

      {/* Cert status */}
      <div className="flex items-center gap-1 shrink-0" style={{ color: cert.color }}>
        <CertIcon size={11} />
        <span className="tabular-nums text-[10px] font-medium">{cert.label}</span>
      </div>
    </div>
  );
}

export default function NPMPlusWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<NPMData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an NPMPlus integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
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

  const hosts = data?.hosts ?? [];
  const enabled = hosts.filter((h) => h.enabled).length;
  const expiringSoon = hosts.filter((h) => (h.daysUntilExpiry ?? 999) < 30).length;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        <span style={{ color: "var(--fg-muted)" }}>{enabled} active</span>
        {expiringSoon > 0 && (
          <span className="font-semibold" style={{ color: "#f59e0b" }}>
            {expiringSoon} cert{expiringSoon > 1 ? "s" : ""} expiring
          </span>
        )}
        <span style={{ color: "var(--fg-muted)" }}>{hosts.length} total</span>
      </div>

      {/* Host rows */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {hosts.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>No proxy hosts</p>
        )}
        {hosts
          .sort((a, b) => (a.daysUntilExpiry ?? 999) - (b.daysUntilExpiry ?? 999))
          .map((host) => <HostRow key={host.id} host={host} />)}
      </div>
    </div>
  );
}
