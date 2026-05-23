"use client";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

const ACCENT_PRESETS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

export default function ThemePage() {
  const { data: theme, refetch } = trpc.settings.getTheme.useQuery();
  const save = trpc.settings.set.useMutation({ onSuccess: () => refetch() });
  const [cssValue, setCssValue] = useState("");

  useEffect(() => {
    if (theme?.customCss !== undefined) setCssValue(theme.customCss ?? "");
  }, [theme?.customCss]);

  function update(key: string, value: unknown) {
    const next = { ...(theme ?? {}), [key]: value };
    save.mutate({ key: "theme", value: next });
    if (key === "accentColor") {
      document.documentElement.style.setProperty("--accent", value as string);
    }
    if (key === "fontScale") {
      document.documentElement.style.setProperty("--font-scale", `${value}%`);
    }
  }

  function saveCustomCss() {
    update("customCss", cssValue);
  }

  if (!theme) return <div className="skeleton h-40 rounded-2xl" />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">Theme</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>Customise the look and feel.</p>
      </div>

      <Section title="Accent colour">
        <div className="flex flex-wrap gap-2">
          {ACCENT_PRESETS.map((color) => (
            <button
              key={color}
              onClick={() => update("accentColor", color)}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110"
              style={{
                background: color,
                outline: theme.accentColor === color ? `3px solid ${color}` : "none",
                outlineOffset: "3px",
              }}
            />
          ))}
          <input
            type="color"
            value={theme.accentColor ?? "#6366f1"}
            onChange={(e) => update("accentColor", e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
            title="Custom colour"
          />
        </div>
      </Section>

      <Section title="Background">
        <div className="grid grid-cols-3 gap-2">
          {(["gradient", "solid", "image"] as const).map((bg) => (
            <button
              key={bg}
              onClick={() => update("background", bg)}
              className="py-2.5 rounded-xl text-sm capitalize transition-all"
              style={{
                background: theme.background === bg ? "var(--accent)20" : "var(--bg-elevated)",
                border: `1px solid ${theme.background === bg ? "var(--accent)50" : "var(--border)"}`,
                color: theme.background === bg ? "var(--accent)" : "var(--fg-muted)",
              }}
            >
              {bg === "gradient" ? "Animated gradient" : bg === "solid" ? "Solid dark" : "Image"}
            </button>
          ))}
        </div>
        {theme.background === "image" && (
          <input
            type="url"
            value={theme.backgroundValue ?? ""}
            onChange={(e) => update("backgroundValue", e.target.value)}
            placeholder="Image URL"
            className="input-field w-full mt-2"
          />
        )}
      </Section>

      <Section title="Widget style">
        <div className="grid grid-cols-3 gap-2">
          {(["glass", "solid", "minimal"] as const).map((style) => (
            <button
              key={style}
              onClick={() => update("widgetStyle", style)}
              className="py-2.5 rounded-xl text-sm capitalize transition-all"
              style={{
                background: theme.widgetStyle === style ? "var(--accent)20" : "var(--bg-elevated)",
                border: `1px solid ${theme.widgetStyle === style ? "var(--accent)50" : "var(--border)"}`,
                color: theme.widgetStyle === style ? "var(--accent)" : "var(--fg-muted)",
              }}
            >
              {style}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Widget opacity">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={40}
            max={100}
            value={theme.widgetOpacity ?? 85}
            onChange={(e) => update("widgetOpacity", Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-sm tabular-nums w-10 text-right" style={{ color: "var(--fg-muted)" }}>
            {theme.widgetOpacity ?? 85}%
          </span>
        </div>
      </Section>

      <Section title="Font scale">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={80}
            max={130}
            step={5}
            value={theme.fontScale ?? 100}
            onChange={(e) => update("fontScale", Number(e.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <span className="text-sm tabular-nums w-10 text-right" style={{ color: "var(--fg-muted)" }}>
            {theme.fontScale ?? 100}%
          </span>
        </div>
      </Section>

      <Section title="Custom CSS">
        <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>
          Injected into the page. Use CSS variables like <code className="font-mono">--accent</code>, <code className="font-mono">--bg</code>, <code className="font-mono">--border</code>.
        </p>
        <textarea
          value={cssValue}
          onChange={(e) => setCssValue(e.target.value)}
          rows={6}
          placeholder={`/* Example */\n.widget-frame {\n  border-radius: 20px;\n}`}
          className="input-field w-full font-mono text-xs resize-y"
          style={{ minHeight: "120px" }}
        />
        <button
          onClick={saveCustomCss}
          disabled={save.isPending}
          className="self-start mt-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {save.isPending ? "Saving…" : "Save CSS"}
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <p className="font-medium text-sm">{title}</p>
      {children}
    </div>
  );
}
