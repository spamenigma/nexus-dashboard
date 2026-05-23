"use client";
import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";
import type { WidgetProps } from "@/widgets/registry";

const BUILT_IN_ENGINES: Record<string, { name: string; url: string }> = {
  duckduckgo: { name: "DuckDuckGo", url: "https://duckduckgo.com/?q={q}" },
  google: { name: "Google", url: "https://www.google.com/search?q={q}" },
  bing: { name: "Bing", url: "https://www.bing.com/search?q={q}" },
  perplexity: { name: "Perplexity", url: "https://www.perplexity.ai/search?q={q}" },
};

export default function SearchBarWidget({ config }: WidgetProps) {
  const [query, setQuery] = useState("");
  const [selectedEngine, setSelectedEngine] = useState(config.engine as string ?? "duckduckgo");
  const inputRef = useRef<HTMLInputElement>(null);

  const customEngines = (config.customEngines as { id: string; name: string; url: string }[]) ?? [];
  const engines = {
    ...BUILT_IN_ENGINES,
    ...Object.fromEntries(customEngines.map((e) => [e.id, { name: e.name, url: e.url }])),
  };

  const engine = engines[selectedEngine] ?? engines.duckduckgo;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const url = engine.url.replace("{q}", encodeURIComponent(query.trim()));
    if (config.openInNewTab !== false) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
    setQuery("");
  }

  return (
    <div className="flex flex-col justify-center h-full px-2">
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--fg-muted)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={(config.placeholder as string) ?? "Search…"}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm transition-all accent-ring"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              outline: "none",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
        </div>
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value)}
          className="text-xs px-2 py-2.5 rounded-xl cursor-pointer"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            color: "var(--fg-muted)",
          }}
        >
          {Object.entries(engines).map(([id, e]) => (
            <option key={id} value={id}>{e.name}</option>
          ))}
        </select>
      </form>
      <p className="text-xs mt-1 text-center" style={{ color: "var(--fg-muted)", opacity: 0.5 }}>
        Press <kbd className="px-1 py-0.5 rounded" style={{ background: "var(--bg-elevated)", fontSize: "10px" }}>/</kbd> to focus
      </p>
    </div>
  );
}
