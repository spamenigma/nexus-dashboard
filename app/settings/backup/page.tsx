"use client";
import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function BackupPage() {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { refetch: fetchExport } = trpc.settings.exportConfig.useQuery(undefined, { enabled: false });
  const importConfig = trpc.settings.importConfig.useMutation({
    onSuccess: () => { setImportDone(true); setImporting(false); },
    onError: (e) => { setImportError(e.message); setImporting(false); },
  });

  async function handleExport() {
    const result = await fetchExport();
    if (!result.data) return;
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportDone(false);
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as { pages?: unknown[]; settings?: unknown };
        if (!data.pages) throw new Error("Invalid backup file — missing pages");
        importConfig.mutate(data as Parameters<typeof importConfig.mutate>[0]);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Invalid file");
        setImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">Backup &amp; Restore</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
          Export your layout and settings. Integration credentials are not included in exports.
        </p>
      </div>

      {/* Export */}
      <div
        className="flex items-center justify-between p-4 rounded-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="font-medium text-sm">Export config</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Downloads a JSON file with all pages, widgets, and theme settings.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
          style={{ background: "var(--accent)" }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Import */}
      <div
        className="flex flex-col gap-3 p-4 rounded-2xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="font-medium text-sm">Import config</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Replaces all current pages and widgets. Settings are merged. This cannot be undone.
          </p>
        </div>

        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
          style={{ background: "#f97316" + "18", border: "1px solid #f97316" + "40", color: "#f97316" }}
        >
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          All existing pages and widgets will be deleted before import.
        </div>

        {importError && (
          <p className="text-xs" style={{ color: "#ef4444" }}>{importError}</p>
        )}
        {importDone && (
          <p className="text-xs" style={{ color: "#22c55e" }}>Import successful. Reload the page to see your restored layout.</p>
        )}

        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium self-start transition-all disabled:opacity-50"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg)" }}
        >
          <Upload size={14} /> {importing ? "Importing…" : "Choose file"}
        </button>
      </div>
    </div>
  );
}
