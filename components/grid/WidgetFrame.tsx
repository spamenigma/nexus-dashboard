"use client";
import { useState, Suspense, lazy, type ComponentType } from "react";
import { X, Settings2, GripVertical, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { WidgetProps } from "@/widgets/registry";

interface WidgetFrameProps {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  editMode: boolean;
  widgetStyle?: string;
  onDelete?: () => void;
  onOpenSettings?: () => void;
  componentLoader: () => Promise<{ default: ComponentType<WidgetProps> }>;
}

function WidgetError() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: "var(--fg-muted)" }}>
      <AlertTriangle size={24} />
      <p className="text-sm">Widget failed to load</p>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-3 h-full">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-4 w-5/6" />
    </div>
  );
}

class WidgetErrorBoundary extends Error {}

function withErrorBoundary(Component: ComponentType<WidgetProps>): ComponentType<WidgetProps> {
  return function WrappedWidget(props: WidgetProps) {
    return <Component {...props} />;
  };
}

export function WidgetFrame({
  id, type, title, config, editMode, widgetStyle = "glass",
  onDelete, onOpenSettings, componentLoader,
}: WidgetFrameProps) {
  const [LazyWidget] = useState(() => lazy(componentLoader));

  const styleClass =
    widgetStyle === "solid" ? "widget-solid" :
    widgetStyle === "minimal" ? "widget-minimal" :
    "widget-glass";

  return (
    <motion.div
      className={cn(
        styleClass,
        "h-full w-full flex flex-col overflow-hidden relative group",
        editMode && "ring-1 ring-inset ring-[var(--accent)]/30"
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header — only shown when there's a title or in edit mode */}
      {(title || editMode) && (
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 gap-2 shrink-0",
            editMode && "widget-drag-handle cursor-move"
          )}
          style={{ borderBottom: title || editMode ? "1px solid var(--border)" : "none" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {editMode && (
              <GripVertical size={14} className="shrink-0" style={{ color: "var(--fg-muted)" }} />
            )}
            {title && (
              <span className="text-sm font-medium truncate" style={{ color: "var(--fg-muted)" }}>
                {title}
              </span>
            )}
          </div>
          {editMode && (
            <div className="flex items-center gap-1 shrink-0">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-1 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: "var(--fg-muted)" }}
                  title="Widget settings"
                >
                  <Settings2 size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 rounded-lg transition-colors hover:bg-red-500/20 hover:text-red-400"
                  style={{ color: "var(--fg-muted)" }}
                  title="Remove widget"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Widget content */}
      <div className="flex-1 min-h-0 p-3">
        <Suspense fallback={<WidgetSkeleton />}>
          <LazyWidget id={id} config={config} editMode={editMode} />
        </Suspense>
      </div>
    </motion.div>
  );
}
