"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { DashboardHeader } from "@/components/grid/DashboardHeader";
import { DashboardGrid } from "@/components/grid/DashboardGrid";
import "@/widgets/index"; // register all widgets

interface Page { id: string; name: string; slug: string; icon: string; order: number; }
interface Theme {
  background?: string;
  widgetStyle?: string;
  accentColor?: string;
  widgetOpacity?: number;
  fontScale?: number;
  customCss?: string;
}

export function DashboardClient({ initialPages, theme }: { initialPages: Page[]; theme: Theme }) {
  const [editMode, setEditMode] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(initialPages[0]?.id ?? "");
  const [gridKey, setGridKey] = useState(0);
  const styleTagRef = useRef<HTMLStyleElement | null>(null);

  const { data: pages = initialPages, refetch: refetchPages } = trpc.pages.list.useQuery();

  // Apply all theme CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (theme.accentColor) root.style.setProperty("--accent", theme.accentColor);
    if (theme.fontScale) root.style.setProperty("font-size", `${theme.fontScale}%`);
    if (theme.widgetOpacity !== undefined) {
      root.style.setProperty("--widget-opacity", String(theme.widgetOpacity / 100));
    }
  }, [theme]);

  // Inject custom CSS
  useEffect(() => {
    if (!styleTagRef.current) {
      const el = document.createElement("style");
      el.id = "nexus-custom-css";
      document.head.appendChild(el);
      styleTagRef.current = el;
    }
    styleTagRef.current.textContent = theme.customCss ?? "";
  }, [theme.customCss]);

  // Keep currentPageId valid after page add/delete
  useEffect(() => {
    if (pages.length > 0 && !pages.find((p) => p.id === currentPageId)) {
      setCurrentPageId(pages[0].id);
    }
  }, [pages, currentPageId]);

  // Keyboard shortcuts
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "e" && !e.metaKey && !e.ctrlKey) {
        setEditMode((v) => !v);
      }
      if (e.key === "Escape") {
        setEditMode(false);
      }
      // 1–9 to jump to page by index
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && pages[num - 1]) {
        setCurrentPageId(pages[num - 1].id);
      }
    },
    [pages]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const bgClass =
    !theme.background || theme.background === "gradient"
      ? "bg-animated-gradient"
      : "";

  return (
    <div
      className={`min-h-screen ${bgClass}`}
      style={
        theme.background === "solid"
          ? { background: "var(--bg)" }
          : theme.background === "image" && theme.widgetStyle
          ? { backgroundImage: `url(${theme.widgetStyle})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {}
      }
    >
      <DashboardHeader
        pages={pages}
        currentPageId={currentPageId}
        editMode={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onPageChange={setCurrentPageId}
        onPageAdded={() => refetchPages()}
        onWidgetAdded={() => setGridKey((k) => k + 1)}
      />

      <main className="pt-14 px-4 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentPageId && (
            <motion.div
              key={currentPageId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <DashboardGrid
                key={`${currentPageId}-${gridKey}`}
                pageId={currentPageId}
                editMode={editMode}
                widgetStyle={theme.widgetStyle ?? "glass"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
