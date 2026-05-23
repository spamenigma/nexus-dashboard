"use client";
import { useEffect, useState, useRef } from "react";

interface SSEEvent {
  integrationId: string;
  type?: string;
  data?: unknown;
  error?: string;
}

export function useIntegrationData<T>(integrationId: string | undefined): {
  data: T | null;
  error: string | null;
  loading: boolean;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!integrationId) { setLoading(false); return; }

    if (!esRef.current) {
      esRef.current = new EventSource("/api/stream");
    }
    const es = esRef.current;

    function onUpdate(e: MessageEvent) {
      const msg = JSON.parse(e.data) as SSEEvent;
      if (msg.integrationId !== integrationId) return;
      setData(msg.data as T);
      setError(null);
      setLoading(false);
    }

    function onError(e: MessageEvent) {
      const msg = JSON.parse(e.data) as SSEEvent;
      if (msg.integrationId !== integrationId) return;
      setError(msg.error ?? "Unknown error");
      setLoading(false);
    }

    es.addEventListener("integration-update", onUpdate);
    es.addEventListener("integration-error", onError);

    return () => {
      es.removeEventListener("integration-update", onUpdate);
      es.removeEventListener("integration-error", onError);
    };
  }, [integrationId]);

  return { data, error, loading };
}
