"use client";
import { useEffect, useRef } from "react";
import type { WidgetProps } from "@/widgets/registry";

export default function IframeEmbedWidget({ config }: WidgetProps) {
  const url = config.url as string | undefined;
  const refreshInterval = (config.refreshInterval as number) ?? 0;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const timer = setInterval(() => {
      if (iframeRef.current) iframeRef.current.src = url ?? "";
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [url, refreshInterval]);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: "var(--fg-muted)" }}>
        <p className="text-sm">No URL configured.</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      src={url}
      className="w-full h-full rounded-xl border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      title="Embedded content"
    />
  );
}
