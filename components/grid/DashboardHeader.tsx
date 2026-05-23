"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Plus, Settings, LayoutDashboard, Check, X, Pencil, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { AddWidgetModal } from "./AddWidgetModal";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

interface Page {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
}

interface DashboardHeaderProps {
  pages: Page[];
  currentPageId: string;
  editMode: boolean;
  onToggleEdit: () => void;
  onPageChange: (id: string) => void;
  onPageAdded: () => void;
  onWidgetAdded: () => void;
}

export function DashboardHeader({
  pages, currentPageId, editMode, onToggleEdit, onPageChange, onPageAdded, onWidgetAdded,
}: DashboardHeaderProps) {
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const createPage = trpc.pages.create.useMutation({
    onSuccess: () => { onPageAdded(); setAddingPage(false); setNewPageName(""); },
  });
  const updatePage = trpc.pages.update.useMutation({
    onSuccess: () => { onPageAdded(); setRenamingPageId(null); },
  });
  const deletePage = trpc.pages.delete.useMutation({ onSuccess: () => onPageAdded() });

  useEffect(() => {
    if (addingPage) addInputRef.current?.focus();
  }, [addingPage]);

  useEffect(() => {
    if (renamingPageId) renameInputRef.current?.focus();
  }, [renamingPageId]);

  function submitNewPage() {
    if (newPageName.trim()) createPage.mutate({ name: newPageName.trim() });
  }

  function submitRename() {
    if (renameValue.trim() && renamingPageId) {
      updatePage.mutate({ id: renamingPageId, name: renameValue.trim() });
    } else {
      setRenamingPageId(null);
    }
  }

  function startRename(page: Page) {
    setRenamingPageId(page.id);
    setRenameValue(page.name);
  }

  function handleDeletePage(page: Page) {
    if (pages.length <= 1) return;
    if (page.id === currentPageId) {
      const other = pages.find((p) => p.id !== page.id);
      if (other) onPageChange(other.id);
    }
    deletePage.mutate({ id: page.id });
  }

  // Drag-to-reorder pages
  function onDragStart(id: string) { setDraggingId(id); }
  function onDragOver(e: React.DragEvent, id: string) { e.preventDefault(); setDragOverId(id); }
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    // Reorder: swap orders
    const src = pages.find((p) => p.id === draggingId);
    const tgt = pages.find((p) => p.id === targetId);
    if (!src || !tgt) return;
    updatePage.mutate({ id: draggingId, order: tgt.order });
    updatePage.mutate({ id: targetId, order: src.order });
    setDraggingId(null);
    setDragOverId(null);
  }
  function onDragEnd() { setDraggingId(null); setDragOverId(null); }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center gap-2 px-4 h-14 shrink-0"
        style={{
          background: "rgba(10,10,15,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <LayoutDashboard size={18} style={{ color: "var(--accent)" }} />
          <span className="font-bold text-sm tracking-tight text-accent-glow">Nexus</span>
        </div>

        {/* Page tabs */}
        <nav className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
          {pages.map((page) => {
            const isActive = currentPageId === page.id;
            const isRenaming = renamingPageId === page.id;
            const isDragOver = dragOverId === page.id && draggingId !== page.id;

            if (isRenaming) {
              return (
                <div
                  key={page.id}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0"
                  style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)50" }}
                >
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") setRenamingPageId(null);
                    }}
                    className="bg-transparent text-sm outline-none w-24"
                    style={{ color: "var(--fg)" }}
                  />
                  <button onClick={submitRename} className="p-0.5 rounded transition-colors hover:text-green-400" style={{ color: "var(--fg-muted)" }}>
                    <Check size={12} />
                  </button>
                  <button onClick={() => setRenamingPageId(null)} className="p-0.5 rounded transition-colors hover:text-red-400" style={{ color: "var(--fg-muted)" }}>
                    <X size={12} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={page.id}
                className="relative flex items-center group shrink-0"
                draggable={editMode}
                onDragStart={() => onDragStart(page.id)}
                onDragOver={(e) => onDragOver(e, page.id)}
                onDrop={(e) => onDrop(e, page.id)}
                onDragEnd={onDragEnd}
                style={{
                  opacity: draggingId === page.id ? 0.4 : 1,
                  borderLeft: isDragOver ? "2px solid var(--accent)" : "2px solid transparent",
                  transition: "border-color 0.15s",
                }}
              >
                {editMode && (
                  <GripVertical
                    size={12}
                    className="shrink-0 cursor-grab mr-0.5"
                    style={{ color: "var(--fg-muted)", opacity: 0.5 }}
                  />
                )}
                <button
                  onClick={() => onPageChange(page.id)}
                  className={cn(
                    "flex items-center px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all",
                    isActive ? "font-medium" : "hover:bg-white/5",
                    editMode && "pr-7"
                  )}
                  style={{
                    background: isActive ? "var(--accent)20" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--fg-muted)",
                    border: isActive ? "1px solid var(--accent)30" : "1px solid transparent",
                  }}
                >
                  {page.name}
                </button>

                {/* Edit mode controls — reveal on hover */}
                {editMode && (
                  <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(page); }}
                      className="p-0.5 rounded hover:bg-white/10 transition-all"
                      style={{ color: "var(--fg-muted)" }}
                      title="Rename page"
                    >
                      <Pencil size={10} />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePage(page); }}
                        className="p-0.5 rounded hover:bg-red-500/20 transition-all"
                        style={{ color: "var(--fg-muted)" }}
                        title="Delete page"
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add page inline input */}
          <AnimatePresence>
            {addingPage ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg shrink-0 overflow-hidden"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                <input
                  ref={addInputRef}
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitNewPage();
                    if (e.key === "Escape") { setAddingPage(false); setNewPageName(""); }
                  }}
                  placeholder="Page name…"
                  className="bg-transparent text-sm outline-none w-24"
                  style={{ color: "var(--fg)" }}
                />
                <button
                  onClick={submitNewPage}
                  disabled={!newPageName.trim() || createPage.isPending}
                  className="p-0.5 rounded transition-colors hover:text-green-400 disabled:opacity-40"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <Check size={12} />
                </button>
                <button
                  onClick={() => { setAddingPage(false); setNewPageName(""); }}
                  className="p-0.5 rounded transition-colors hover:text-red-400"
                  style={{ color: "var(--fg-muted)" }}
                >
                  <X size={12} />
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setAddingPage(true)}
                className="p-1.5 rounded-lg transition-all hover:bg-white/5 shrink-0"
                style={{ color: "var(--fg-muted)" }}
                title="Add page"
              >
                <Plus size={14} />
              </button>
            )}
          </AnimatePresence>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <AnimatePresence>
            {editMode && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: "auto" }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                onClick={() => setShowAddWidget(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all overflow-hidden whitespace-nowrap"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                <Plus size={14} />
                Add widget
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={onToggleEdit}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all",
              editMode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "hover:bg-white/5"
            )}
            style={!editMode ? { color: "var(--fg-muted)" } : undefined}
            title={editMode ? "Lock layout (E)" : "Edit layout (E)"}
          >
            {editMode ? <Unlock size={14} /> : <Lock size={14} />}
            <span className="hidden sm:inline">{editMode ? "Done" : "Edit"}</span>
          </button>

          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-white/5 transition-all"
            style={{ color: "var(--fg-muted)" }}
            title="Settings"
          >
            <Settings size={16} />
          </Link>
        </div>
      </header>

      <AnimatePresence>
        {showAddWidget && (
          <AddWidgetModal
            pageId={currentPageId}
            onClose={() => setShowAddWidget(false)}
            onAdded={onWidgetAdded}
          />
        )}
      </AnimatePresence>
    </>
  );
}
