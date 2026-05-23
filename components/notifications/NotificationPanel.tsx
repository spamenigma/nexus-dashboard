"use client";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, AlertCircle, CheckCircle, AlertTriangle, Info, Trash2, BellOff, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { trpc } from "@/lib/trpc/client";

interface Notification {
  id: string;
  integrationId: string | null;
  integrationName: string | null;
  type: string;
  severity: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onMarkAllRead: () => void;
  onCountChange: (n: number) => void;
}

const SEVERITY_STYLES: Record<string, { color: string; border: string; Icon: React.ElementType }> = {
  critical: { color: "#ef4444", border: "#ef444430", Icon: AlertCircle },
  warning:  { color: "#f59e0b", border: "#f59e0b30", Icon: AlertTriangle },
  info:     { color: "#22c55e", border: "#22c55e30", Icon: CheckCircle },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  recovery: CheckCircle,
  error:    AlertCircle,
  down:     AlertCircle,
  warning:  AlertTriangle,
  info:     Info,
};

export function NotificationPanel({ onClose, onMarkAllRead, onCountChange }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery({ limit: 100 });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => refetch() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      refetch();
      onMarkAllRead();
      onCountChange(0);
    },
  });
  const deleteNote = trpc.notifications.delete.useMutation({ onSuccess: () => refetch() });
  const clearAll = trpc.notifications.clearAll.useMutation({
    onSuccess: () => {
      refetch();
      onCountChange(0);
    },
  });

  // Click-outside closes panel
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [onClose]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,18,0.96)",
        backdropFilter: "blur(24px)",
        border: "1px solid var(--border)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        maxHeight: "min(70vh, 560px)",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Notifications
          </span>
          {unread > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "#ef444420", color: "#ef4444" }}
            >
              {unread} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              title="Mark all read"
              className="p-1.5 rounded-lg transition-all hover:bg-white/5 text-xs flex items-center gap-1"
              style={{ color: "var(--fg-muted)" }}
            >
              <Check size={12} />
              <span className="hidden sm:inline">All read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => clearAll.mutate()}
              title="Clear all"
              className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
              style={{ color: "var(--fg-muted)" }}
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:bg-white/5"
            style={{ color: "var(--fg-muted)" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ color: "var(--fg-muted)" }}>
            <BellOff size={28} style={{ opacity: 0.4 }} />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {notifications.map((note) => (
              <NotificationItem
                key={note.id}
                note={note}
                onMarkRead={() => markRead.mutate({ id: note.id })}
                onDelete={() => deleteNote.mutate({ id: note.id })}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NotificationItem({
  note,
  onMarkRead,
  onDelete,
}: {
  note: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const style = SEVERITY_STYLES[note.severity] ?? SEVERITY_STYLES.info;
  const Icon = TYPE_ICONS[note.type] ?? style.Icon;

  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(note.createdAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <div
      className="group relative flex gap-3 px-4 py-3 transition-all"
      style={{
        background: note.read ? "transparent" : `${style.color}08`,
        borderLeft: `2px solid ${note.read ? "transparent" : style.color}`,
      }}
    >
      <div className="shrink-0 mt-0.5">
        <Icon size={15} style={{ color: style.color }} />
      </div>
      <div className="flex-1 min-w-0">
        {note.integrationName && (
          <p className="text-xs font-medium truncate mb-0.5" style={{ color: style.color }}>
            {note.integrationName}
          </p>
        )}
        <p
          className="text-sm leading-snug"
          style={{ color: note.read ? "var(--fg-muted)" : "var(--fg)" }}
        >
          {note.message}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>
          {timeAgo}
        </p>
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!note.read && (
          <button
            onClick={onMarkRead}
            title="Mark read"
            className="p-1 rounded hover:bg-white/10 transition-all"
            style={{ color: "var(--fg-muted)" }}
          >
            <Check size={11} />
          </button>
        )}
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1 rounded hover:bg-red-500/20 transition-all"
          style={{ color: "var(--fg-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
