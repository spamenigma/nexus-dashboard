"use client";
import { useState, useCallback, useEffect } from "react";
import { GridLayout, noCompactor } from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { getWidget } from "@/widgets/registry";
import { WidgetFrame } from "./WidgetFrame";
import { WidgetConfigDrawer } from "./WidgetConfigDrawer";
import { cn } from "@/lib/cn";

interface DbWidget {
  id: string;
  type: string;
  title: string;
  config: string;
  posX: number;
  posY: number;
  w: number;
  h: number;
}

interface DashboardGridProps {
  pageId: string;
  editMode: boolean;
  widgetStyle?: string;
}

function useWindowWidth() {
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    function update() { setWidth(window.innerWidth); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

function EmptyState({ editMode }: { editMode: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 select-none"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--accent)15", border: "1px solid var(--accent)25" }}
      >
        <LayoutDashboard size={28} style={{ color: "var(--accent)" }} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-base">No widgets yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          {editMode
            ? 'Click "Add widget" in the toolbar to get started'
            : 'Switch to Edit mode to add widgets to this page'}
        </p>
      </div>
      {!editMode && (
        <p className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "var(--bg-elevated)", color: "var(--fg-muted)" }}>
          <Plus size={10} className="inline mr-1 -mt-0.5" />
          Press Edit in the top bar
        </p>
      )}
    </motion.div>
  );
}

export function DashboardGrid({ pageId, editMode, widgetStyle }: DashboardGridProps) {
  const [configuringWidget, setConfiguringWidget] = useState<DbWidget | null>(null);
  const windowWidth = useWindowWidth();

  const { data: widgets, refetch } = trpc.widgets.byPage.useQuery({ pageId });
  const updateLayout = trpc.widgets.updateLayout.useMutation();
  const deleteWidget = trpc.widgets.delete.useMutation({ onSuccess: () => refetch() });

  const onLayoutChange = useCallback(
    (layout: Layout) => {
      if (!editMode) return;
      const items = layout as unknown as Array<{ i: string; x: number; y: number; w: number; h: number }>;
      updateLayout.mutate(
        items.map((item) => ({
          id: item.i,
          posX: item.x,
          posY: item.y,
          w: item.w,
          h: item.h,
        }))
      );
    },
    [editMode, updateLayout]
  );

  if (!widgets) return null;

  if (widgets.length === 0) {
    return <EmptyState editMode={editMode} />;
  }

  const layout = widgets.map((w) => ({
    i: w.id,
    x: w.posX,
    y: w.posY,
    w: w.w,
    h: w.h,
    minW: getWidget(w.type)?.minW ?? 2,
    minH: getWidget(w.type)?.minH ?? 2,
  }));

  return (
    <>
      <div className={cn(editMode && "edit-mode")}>
        <GridLayout
          width={windowWidth - 32}
          layout={layout as unknown as Layout}
          gridConfig={{ cols: 12, rowHeight: 60, margin: [12, 12] as [number, number], containerPadding: null, maxRows: Infinity }}
          dragConfig={{ enabled: editMode, handle: ".widget-drag-handle" }}
          resizeConfig={{ enabled: editMode, handles: ["se"] as ["se"] }}
          compactor={noCompactor}
          onLayoutChange={onLayoutChange}
          className="layout"
        >
          {widgets.map((widget) => {
            const meta = getWidget(widget.type);
            if (!meta) return null;
            const config = JSON.parse(widget.config) as Record<string, unknown>;

            return (
              <div key={widget.id}>
                <WidgetFrame
                  id={widget.id}
                  type={widget.type}
                  title={widget.title}
                  config={config}
                  editMode={editMode}
                  widgetStyle={widgetStyle}
                  onDelete={() => deleteWidget.mutate({ id: widget.id })}
                  onOpenSettings={() => setConfiguringWidget(widget)}
                  componentLoader={meta.component}
                />
              </div>
            );
          })}
        </GridLayout>
      </div>

      <AnimatePresence>
        {configuringWidget && (
          <WidgetConfigDrawer
            widget={configuringWidget}
            onClose={() => { setConfiguringWidget(null); refetch(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
