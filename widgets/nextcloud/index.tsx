"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { NextcloudData, NextcloudActivity } from "@/lib/poller/fetchers/nextcloud";
import type { WidgetProps } from "@/widgets/registry";
import { formatDistanceToNow } from "date-fns";

function fmtBytes(bytes: number): string {
  const gb = 1024 * 1024 * 1024;
  const mb = 1024 * 1024;
  if (bytes >= gb) return `${(bytes / gb).toFixed(1)} GB`;
  if (bytes >= mb) return `${(bytes / mb).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

// Map Nextcloud app names to friendly labels
const APP_LABEL: Record<string, string> = {
  files: "Files",
  files_sharing: "Sharing",
  calendar: "Calendar",
  contacts: "Contacts",
  notes: "Notes",
  talk: "Talk",
  activity: "Activity",
};

function ActivityRow({ item }: { item: NextcloudActivity }) {
  const app = APP_LABEL[item.app] ?? item.app;
  const ago = item.datetime
    ? formatDistanceToNow(new Date(item.datetime), { addSuffix: true })
    : "";

  return (
    <div className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)" }}>
      <span
        className="text-[10px] px-1.5 py-0.5 rounded uppercase font-medium shrink-0 mt-0.5"
        style={{ background: "var(--accent)20", color: "var(--accent)" }}
      >
        {app}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="truncate">{item.subject}</span>
        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>{ago}</span>
      </div>
    </div>
  );
}

export default function NextcloudWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const maxItems = (config.maxItems as number) ?? 15;
  const { data, error, loading } = useIntegrationData<NextcloudData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure a Nextcloud integration
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

  const activities = (data?.activities ?? []).slice(0, maxItems);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Storage summary if available */}
      {data?.storageUsed !== undefined && (
        <div className="flex items-center justify-between text-xs shrink-0">
          <span style={{ color: "var(--fg-muted)" }}>Storage used</span>
          <span className="font-medium tabular-nums">
            {fmtBytes(data.storageUsed)}
            {data.storageTotal && (
              <span style={{ color: "var(--fg-muted)" }}> / {fmtBytes(data.storageTotal)}</span>
            )}
          </span>
        </div>
      )}

      {/* Activity feed */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {activities.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>No recent activity</p>
        )}
        {activities.map((item) => <ActivityRow key={item.id} item={item} />)}
      </div>
    </div>
  );
}
