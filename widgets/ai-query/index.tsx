"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import type { WidgetProps } from "@/widgets/registry";

interface Message { role: "user" | "assistant"; content: string }

export default function AIQueryWidget({ config }: WidgetProps) {
  const integrationId = config.integrationId as string | undefined;
  const systemPrompt = (config.systemPrompt as string) || undefined;
  const defaultModel = (config.defaultModel as string) || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: integrations } = trpc.integrations.list.useQuery();
  const integration = integrations?.find((i) => i.id === integrationId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function submit() {
    if (!input.trim() || !integrationId || loading) return;
    const userMsg = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, prompt: userMsg, model: defaultModel, systemPrompt }),
      });
      const data = await res.json() as { text?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.text ?? "" }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setMessages((prev) => prev.slice(0, -1)); // remove optimistic user message
      setInput(userMsg);
    } finally {
      setLoading(false);
    }
  }

  if (!integrationId) {
    return (
      <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--fg-muted)" }}>
        Configure an AI integration (OpenAI, Anthropic, or Ollama)
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Model label */}
      {integration && (
        <div className="text-[10px] shrink-0" style={{ color: "var(--fg-muted)" }}>
          {integration.name}{defaultModel ? ` · ${defaultModel}` : ""}
        </div>
      )}

      {/* Message history */}
      <div ref={scrollRef} className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0">
        {messages.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--fg-muted)" }}>
            Ask anything…
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 items-start text-xs ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: msg.role === "user" ? "var(--accent)" : "var(--bg-elevated)", border: "1px solid var(--border)" }}
            >
              {msg.role === "user" ? <User size={10} /> : <Bot size={10} />}
            </span>
            <div
              className="rounded-xl px-2.5 py-1.5 max-w-[85%] whitespace-pre-wrap leading-relaxed"
              style={{
                background: msg.role === "user" ? "var(--accent)20" : "var(--bg-elevated)",
                border: `1px solid ${msg.role === "user" ? "var(--accent)30" : "var(--border)"}`,
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-xs" style={{ color: "var(--fg-muted)" }}>
            <Loader2 size={12} className="animate-spin shrink-0" />
            <span>Thinking…</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs shrink-0" style={{ color: "#ef4444" }}>{error}</p>
      )}

      {/* Input */}
      <div className="flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
          placeholder="Ask something…"
          disabled={loading}
          className="input-field flex-1 text-xs"
        />
        <button
          onClick={submit}
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl transition-all disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
