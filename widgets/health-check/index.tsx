"use client";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import type { WidgetProps } from "@/widgets/registry";

interface CheckConfig { id: string; name: string; url: string }
interface CheckResult { name: string; url: string; ok: boolean; status: number; latencyMs: number; error?: string }

export default function HealthCheckWidget({ config }: WidgetProps) {
  const checks = (config.checks as CheckConfig[]) ?? [];
  const refreshInterval = ((config.refreshInterval as number) ?? 30) * 1000;

  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const runChecks = useCallback(async () => {
    if (checks.length === 0) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checks: checks.map(({ name, url }) => ({ name, url })) }),
      });
      if (res.ok) {
        setResults(await res.json() as CheckResult[]);
        setLastChecked(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [checks]);

  useEffect(() => {
    runChecks();
    const timer = setInterval(runChecks, refreshInterval);
    return () => clearInterval(timer);
  }, [runChecks, refreshInterval]);

  if (checks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Add URLs to monitor in widget settings
      </div>
    );
  }

  const upCount = results.filter((r) => r.ok).length;
  const downCount = results.filter((r) => !r.ok).length;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Summary row */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        {loading ? (
          <Loader2 size={12} className="animate-spin" style={{ color: "var(--fg-muted)" }} />
        ) : (
          <>
            {upCount > 0 && <span className="font-semibold" style={{ color: "#22c55e" }}>{upCount} up</span>}
            {downCount > 0 && <span className="font-semibold" style={{ color: "#ef4444" }}>{downCount} down</span>}
            <button onClick={runChecks} className="ml-auto p-0.5 hover:opacity-70 transition-opacity" style={{ color: "var(--fg-muted)" }}>
              <RefreshCw size={11} />
            </button>
          </>
        )}
      </div>

      {/* Check rows */}
      <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
        {checks.map((check) => {
          const result = results.find((r) => r.name === check.name);
          return (
            <div
              key={check.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--bg-elevated)" }}
            >
              {!result ? (
                <Loader2 size={12} className="animate-spin shrink-0" style={{ color: "var(--fg-muted)" }} />
              ) : result.ok ? (
                <CheckCircle size={12} className="shrink-0" style={{ color: "#22c55e" }} />
              ) : (
                <XCircle size={12} className="shrink-0" style={{ color: "#ef4444" }} />
              )}
              <span className="flex-1 truncate font-medium">{check.name}</span>
              {result && (
                <>
                  {result.ok ? (
                    <span className="tabular-nums shrink-0" style={{ color: "var(--fg-muted)" }}>
                      {result.latencyMs}ms
                    </span>
                  ) : (
                    <span className="tabular-nums shrink-0" style={{ color: "#ef4444" }}>
                      {result.status > 0 ? result.status : "Down"}
                    </span>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {lastChecked && (
        <p className="text-[10px] shrink-0 text-right" style={{ color: "var(--fg-muted)" }}>
          {lastChecked.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </div>
  );
}
