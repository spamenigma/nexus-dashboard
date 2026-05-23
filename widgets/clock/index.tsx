"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { WidgetProps } from "@/widgets/registry";

export default function ClockWidget({ config }: WidgetProps) {
  const [now, setNow] = useState(new Date());
  const showSeconds = config.showSeconds !== false;
  const showDate = config.showDate !== false;
  const format24h = config.format24h !== false;
  const tz = config.timezone as string | undefined;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: !format24h,
    timeZone: tz && tz !== "local" ? tz : undefined,
  });

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: tz && tz !== "local" ? tz : undefined,
  });

  return (
    <div className="flex flex-col items-center justify-center h-full select-none gap-1">
      <div
        className="font-mono font-bold text-accent-glow leading-none tabular-nums"
        style={{ fontSize: "clamp(1.8rem, 6vw, 3.5rem)" }}
      >
        {timeStr}
      </div>
      {showDate && (
        <div className="text-sm" style={{ color: "var(--fg-muted)" }}>
          {dateStr}
        </div>
      )}
    </div>
  );
}
