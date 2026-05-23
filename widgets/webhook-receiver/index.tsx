"use client";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import type { WidgetProps } from "@/widgets/registry";

interface WebhookPayload {
  id: string;
  receivedAt: string;
  body: unknown;
}

export default function WebhookReceiverWidget({ id, config }: WidgetProps) {
  const [payloads, setPayloads] = useState<WebhookPayload[]>([]);
  const maxHistory = (config.maxHistory as number) ?? 10;
  const showTimestamp = config.showTimestamp !== false;
  const endpoint = `/api/webhook/${id}`;

  useEffect(() => {
    // Load existing history
    fetch(`/api/webhook/${id}`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPayloads(data.slice(0, maxHistory)); })
      .catch(() => {});

    const es = new EventSource("/api/stream");

    function onWebhook(e: MessageEvent) {
      const msg = JSON.parse(e.data);
      if (msg.widgetId === id && msg.type === "webhook") {
        setPayloads((prev) => [msg.payload, ...prev].slice(0, maxHistory));
      }
    }
    es.addEventListener("webhook", onWebhook);
    return () => {
      es.removeEventListener("webhook", onWebhook);
      es.close();
    };
  }, [id, maxHistory]);

  return (
    <div className="flex flex-col h-full">
      <div
        className="text-xs px-2 py-1 mb-2 rounded font-mono select-all"
        style={{ background: "var(--bg-elevated)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}
      >
        POST {endpoint}
      </div>
      <div className="flex-1 overflow-auto flex flex-col gap-2">
        {payloads.length === 0 ? (
          <p className="text-sm text-center mt-4" style={{ color: "var(--fg-muted)" }}>
            Waiting for webhooks…
          </p>
        ) : (
          payloads.map((p) => (
            <div
              key={p.id}
              className="rounded-lg p-2"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              {showTimestamp && (
                <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>
                  {formatDistanceToNow(new Date(p.receivedAt), { addSuffix: true })}
                </p>
              )}
              <pre
                className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono"
                style={{ color: "var(--fg)" }}
              >
                {JSON.stringify(p.body, null, 2)}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
