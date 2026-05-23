"use client";
import { useState } from "react";
import type { WidgetProps } from "@/widgets/registry";

interface Link {
  id: string;
  label: string;
  url: string;
  icon?: string;
  color?: string;
  category?: string;
  newTab?: boolean;
}

function getFaviconUrl(url: string): string {
  try {
    const { origin } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=64`;
  } catch {
    return "";
  }
}

function LinkTile({ link, size }: { link: Link; size: string }) {
  const [imgError, setImgError] = useState(false);
  const sizePx = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  const faviconUrl = getFaviconUrl(link.url);
  const accent = link.color ?? "var(--accent)";

  return (
    <a
      href={link.url}
      target={link.newTab !== false ? "_blank" : "_self"}
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200 group cursor-pointer"
      style={{ minWidth: 60 }}
      title={link.label}
    >
      <div
        className="flex items-center justify-center rounded-xl transition-all duration-200 group-hover:scale-110"
        style={{
          width: sizePx + 16,
          height: sizePx + 16,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          boxShadow: `0 0 12px ${accent}20`,
        }}
      >
        {faviconUrl && !imgError ? (
          <img
            src={faviconUrl}
            alt=""
            width={sizePx}
            height={sizePx}
            onError={() => setImgError(true)}
            className="rounded"
          />
        ) : (
          <span className="text-lg font-bold" style={{ color: accent }}>
            {link.label[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <span
        className="text-xs text-center leading-tight max-w-[70px] truncate group-hover:text-white transition-colors"
        style={{ color: "var(--fg-muted)" }}
      >
        {link.label}
      </span>
    </a>
  );
}

export default function QuickLinksWidget({ config }: WidgetProps) {
  const links = (config.links as Link[]) ?? [];
  const size = (config.iconSize as string) ?? "md";
  const showCategories = config.showCategories === true;

  if (links.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--fg-muted)" }}>
        <p className="text-sm">No links yet — open settings to add some.</p>
      </div>
    );
  }

  if (showCategories) {
    const grouped = links.reduce<Record<string, Link[]>>((acc, l) => {
      const cat = l.category || "General";
      (acc[cat] ??= []).push(l);
      return acc;
    }, {});

    return (
      <div className="flex flex-col gap-3 p-2 h-full overflow-auto">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <p className="text-xs uppercase tracking-wider mb-1.5 px-1" style={{ color: "var(--fg-muted)" }}>{cat}</p>
            <div className="flex flex-wrap gap-1">
              {items.map((l) => <LinkTile key={l.id} link={l} size={size} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 content-start overflow-auto h-full">
      {links.map((l) => <LinkTile key={l.id} link={l} size={size} />)}
    </div>
  );
}
