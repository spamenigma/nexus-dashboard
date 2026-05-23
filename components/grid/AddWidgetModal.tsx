"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Search, Clock, Grid, Monitor, Webhook, FileText, Activity, HeartPulse, Container, PlayCircle, Film, Tv, Inbox, ArrowDownCircle, Shield, Lock, Heart, Sparkles, Cloud, Mail, HardDrive, ShieldAlert, Radio, LayoutDashboard, type LucideIcon } from "lucide-react";
import { getAllWidgets, getWidgetsByCategory } from "@/widgets/registry";
import { trpc } from "@/lib/trpc/client";

const CATEGORY_LABELS: Record<string, string> = {
  core: "Core",
  monitoring: "Monitoring",
  media: "Media",
  infrastructure: "Infrastructure",
  comms: "Communication",
};

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  grid: Grid,
  search: Search,
  monitor: Monitor,
  webhook: Webhook,
  "file-text": FileText,
  activity: Activity,
  "heart-pulse": HeartPulse,
  container: Container,
  "play-circle": PlayCircle,
  film: Film,
  tv: Tv,
  inbox: Inbox,
  "arrow-down-circle": ArrowDownCircle,
  shield: Shield,
  lock: Lock,
  heart: Heart,
  sparkles: Sparkles,
  cloud: Cloud,
  mail: Mail,
};

function WidgetIcon({ icon }: { icon: string }) {
  const Icon = ICON_MAP[icon] ?? LayoutDashboard;
  return <Icon size={16} style={{ color: "var(--accent)" }} />;
}

interface AddWidgetModalProps {
  pageId: string;
  onClose: () => void;
  onAdded: () => void;
}

export function AddWidgetModal({ pageId, onClose, onAdded }: AddWidgetModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const createWidget = trpc.widgets.create.useMutation({ onSuccess: () => { onAdded(); onClose(); } });
  const byCategory = getWidgetsByCategory();

  const filtered = search
    ? getAllWidgets().filter(
        (w) =>
          w.label.toLowerCase().includes(search.toLowerCase()) ||
          w.description.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  function add() {
    const meta = getAllWidgets().find((w) => w.type === selected);
    if (!meta) return;
    createWidget.mutate({
      type: meta.type,
      pageId,
      w: meta.defaultW,
      h: meta.defaultH,
    });
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            maxHeight: "80vh",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          }}
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <p className="font-semibold">Add widget</p>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
              style={{ color: "var(--fg-muted)" }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-muted)" }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search widgets…"
                className="input-field w-full pl-8 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Widget list */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {(filtered
              ? [["results", filtered]] as [string, typeof filtered][]
              : Array.from(byCategory.entries())
            ).map(([category, widgets]) => (
              <div key={category}>
                <p className="text-xs uppercase tracking-wider mb-2 px-1" style={{ color: "var(--fg-muted)" }}>
                  {filtered ? "Results" : (CATEGORY_LABELS[category] ?? category)}
                </p>
                <div className="flex flex-col gap-1">
                  {widgets.map((w) => (
                    <button
                      key={w.type}
                      onClick={() => setSelected(w.type === selected ? null : w.type)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                      style={{
                        background: selected === w.type ? "var(--accent)18" : "var(--bg-elevated)",
                        border: `1px solid ${selected === w.type ? "var(--accent)50" : "var(--border)"}`,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: selected === w.type ? "var(--accent)20" : "var(--bg-surface)",
                          border: `1px solid ${selected === w.type ? "var(--accent)30" : "var(--border)"}`,
                        }}
                      >
                        <WidgetIcon icon={w.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{w.label}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--fg-muted)" }}>{w.description}</p>
                      </div>
                      {selected === w.type && (
                        <div
                          className="w-4 h-4 rounded-full shrink-0 mt-1 flex items-center justify-center"
                          style={{ background: "var(--accent)" }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3 shrink-0 flex justify-end gap-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm transition-all hover:bg-white/10"
              style={{ color: "var(--fg-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={add}
              disabled={!selected || createWidget.isPending}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              {createWidget.isPending ? "Adding…" : "Add widget"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
