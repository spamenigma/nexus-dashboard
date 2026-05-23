"use client";
import { useIntegrationData } from "@/lib/hooks/useIntegrationData";
import type { IMAPData, IMAPFolder } from "@/lib/poller/fetchers/imap";
import type { WidgetProps } from "@/widgets/registry";
import { Mail, MailOpen } from "lucide-react";

function FolderRow({ folder }: { folder: IMAPFolder }) {
  const hasUnread = folder.unseen > 0;
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
      style={{ background: "var(--bg-elevated)" }}
    >
      {hasUnread
        ? <Mail size={12} className="shrink-0" style={{ color: "var(--accent)" }} />
        : <MailOpen size={12} className="shrink-0" style={{ color: "var(--fg-muted)" }} />
      }
      <span className="flex-1 font-medium truncate">{folder.name}</span>
      <div className="flex items-center gap-2 shrink-0 tabular-nums">
        {hasUnread && (
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {folder.unseen}
          </span>
        )}
        <span style={{ color: "var(--fg-muted)" }}>{folder.messages} total</span>
      </div>
    </div>
  );
}

export default function IMAPWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const { data, error, loading } = useIntegrationData<IMAPData>(integrationId);

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an Email (IMAP) integration
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-1 justify-center h-full">
        {[1, 2].map((i) => <div key={i} className="skeleton h-9 rounded-lg" />)}
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

  const { folders = [], totalUnseen = 0 } = data ?? {};

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        {totalUnseen > 0 ? (
          <span className="font-semibold" style={{ color: "var(--accent)" }}>
            {totalUnseen} unread
          </span>
        ) : (
          <span style={{ color: "#22c55e" }}>All read</span>
        )}
        <span style={{ color: "var(--fg-muted)" }}>{folders.length} folder{folders.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Folder list */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {folders.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>No folders</p>
        )}
        {folders.map((folder) => <FolderRow key={folder.name} folder={folder} />)}
      </div>
    </div>
  );
}
