"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Plus, Trash2, Send, Power, ChevronDown, ChevronUp, X, Check,
  MessageSquare, Webhook, Bot, Bell
} from "lucide-react";
import { cn } from "@/lib/cn";

type ChannelType = "discord" | "slack" | "ntfy" | "gotify" | "telegram" | "webhook";

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  config: Record<string, unknown>;
  enabled: boolean;
  createdAt: Date | string;
}

const CHANNEL_META: Record<ChannelType, { label: string; icon: React.ElementType; color: string }> = {
  discord:  { label: "Discord",  icon: MessageSquare, color: "#5865F2" },
  slack:    { label: "Slack",    icon: MessageSquare, color: "#4A154B" },
  ntfy:     { label: "ntfy",     icon: Bell,          color: "#009485" },
  gotify:   { label: "Gotify",   icon: Bell,          color: "#2a73e8" },
  telegram: { label: "Telegram", icon: Bot,           color: "#26A5E4" },
  webhook:  { label: "Webhook",  icon: Webhook,       color: "#888888" },
};

const CONFIG_FIELDS: Record<ChannelType, Array<{ key: string; label: string; placeholder: string; secret?: boolean; optional?: boolean }>> = {
  discord:  [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://discord.com/api/webhooks/…", secret: true }],
  slack:    [{ key: "webhookUrl", label: "Webhook URL", placeholder: "https://hooks.slack.com/services/…", secret: true }],
  ntfy:     [
    { key: "url",   label: "Server URL", placeholder: "https://ntfy.sh" },
    { key: "topic", label: "Topic",      placeholder: "my-homelab-alerts" },
    { key: "token", label: "Token",      placeholder: "(optional, for private topics)", secret: true, optional: true },
  ],
  gotify:   [
    { key: "url",      label: "Server URL", placeholder: "https://gotify.example.com" },
    { key: "token",    label: "App Token",  placeholder: "your-app-token", secret: true },
    { key: "priority", label: "Priority",   placeholder: "5 (optional)", optional: true },
  ],
  telegram: [
    { key: "botToken", label: "Bot Token", placeholder: "123456:ABC-DEF…", secret: true },
    { key: "chatId",   label: "Chat ID",   placeholder: "-100123456789" },
  ],
  webhook:  [
    { key: "url",    label: "URL",    placeholder: "https://example.com/webhook" },
    { key: "method", label: "Method", placeholder: "POST (optional)", optional: true },
  ],
};

export default function NotificationsSettingsPage() {
  const { data: channels = [], refetch } = trpc.notifications.channelList.useQuery();
  const createChannel = trpc.notifications.channelCreate.useMutation({ onSuccess: () => { refetch(); setAdding(false); resetForm(); } });
  const updateChannel = trpc.notifications.channelUpdate.useMutation({ onSuccess: () => refetch() });
  const deleteChannel = trpc.notifications.channelDelete.useMutation({ onSuccess: () => refetch() });
  const testChannel   = trpc.notifications.channelTest.useMutation();

  const [adding, setAdding] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail">>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [newType, setNewType] = useState<ChannelType>("discord");
  const [newName, setNewName] = useState("");
  const [newConfig, setNewConfig] = useState<Record<string, string>>({});

  function resetForm() {
    setNewType("discord");
    setNewName("");
    setNewConfig({});
  }

  function handleCreate() {
    if (!newName.trim()) return;
    const config: Record<string, unknown> = {};
    for (const f of CONFIG_FIELDS[newType]) {
      if (newConfig[f.key]) config[f.key] = newConfig[f.key];
    }
    createChannel.mutate({ name: newName.trim(), type: newType, config });
  }

  async function handleTest(id: string) {
    setTestingId(id);
    setTestResult((r) => ({ ...r, [id]: undefined as unknown as "ok" }));
    try {
      await testChannel.mutateAsync({ id });
      setTestResult((r) => ({ ...r, [id]: "ok" }));
    } catch {
      setTestResult((r) => ({ ...r, [id]: "fail" }));
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult((r) => { const c = { ...r }; delete c[id]; return c; }), 3_000);
    }
  }

  function handleToggle(channel: Channel) {
    updateChannel.mutate({ id: channel.id, enabled: !channel.enabled });
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
            Notification Channels
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Send alerts to external services when integrations go down or recover.
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); resetForm(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={14} />
          Add Channel
        </button>
      </div>

      {/* Add channel form */}
      {adding && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium" style={{ color: "var(--fg)" }}>New Channel</h3>
            <button onClick={() => { setAdding(false); resetForm(); }} style={{ color: "var(--fg-muted)" }}>
              <X size={14} />
            </button>
          </div>

          {/* Type picker */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(CHANNEL_META) as ChannelType[]).map((t) => {
              const { label, icon: Icon, color } = CHANNEL_META[t];
              return (
                <button
                  key={t}
                  onClick={() => { setNewType(t); setNewConfig({}); }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                    newType === t ? "ring-1" : "hover:bg-white/5"
                  )}
                  style={{
                    background: newType === t ? `${color}20` : "transparent",
                    border: `1px solid ${newType === t ? color + "60" : "var(--border)"}`,
                    color: newType === t ? color : "var(--fg-muted)",
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--fg-muted)" }}>Channel Name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`My ${CHANNEL_META[newType].label}`}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--fg)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)50")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Type-specific config fields */}
          {CONFIG_FIELDS[newType].map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {f.label}{f.optional && <span className="ml-1 opacity-50">(optional)</span>}
              </label>
              <input
                type={f.secret ? "password" : "text"}
                value={newConfig[f.key] ?? ""}
                onChange={(e) => setNewConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)50")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => { setAdding(false); resetForm(); }}
              className="px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/5"
              style={{ color: "var(--fg-muted)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || createChannel.isPending}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {createChannel.isPending ? "Adding…" : "Add Channel"}
            </button>
          </div>
        </div>
      )}

      {/* Channel list */}
      {channels.length === 0 && !adding ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-12 gap-3"
          style={{ border: "1px dashed var(--border)", color: "var(--fg-muted)" }}
        >
          <Bell size={28} style={{ opacity: 0.3 }} />
          <p className="text-sm">No channels configured. Add one to start receiving alerts.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(channels as Channel[]).map((channel) => {
            const meta = CHANNEL_META[channel.type] ?? CHANNEL_META.webhook;
            const Icon = meta.icon;
            const result = testResult[channel.id];

            return (
              <div
                key={channel.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${meta.color}20` }}
                  >
                    <Icon size={15} style={{ color: meta.color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
                      {channel.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {meta.label}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Test button */}
                    <button
                      onClick={() => handleTest(channel.id)}
                      disabled={testingId === channel.id}
                      title="Send test notification"
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all hover:bg-white/5 disabled:opacity-40"
                      style={{
                        color: result === "ok" ? "#22c55e" : result === "fail" ? "#ef4444" : "var(--fg-muted)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {result === "ok" ? (
                        <><Check size={11} /> Sent</>
                      ) : result === "fail" ? (
                        <><X size={11} /> Failed</>
                      ) : (
                        <><Send size={11} /> Test</>
                      )}
                    </button>

                    {/* Enable/disable toggle */}
                    <button
                      onClick={() => handleToggle(channel)}
                      title={channel.enabled ? "Disable" : "Enable"}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ color: channel.enabled ? "var(--accent)" : "var(--fg-muted)" }}
                    >
                      <Power size={13} />
                    </button>

                    {/* Expand / collapse */}
                    <button
                      onClick={() => setExpandedId(expandedId === channel.id ? null : channel.id)}
                      className="p-1.5 rounded-lg transition-all hover:bg-white/5"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {expandedId === channel.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteChannel.mutate({ id: channel.id })}
                      title="Delete channel"
                      className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                      style={{ color: "var(--fg-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Expanded config editor */}
                {expandedId === channel.id && (
                  <ChannelConfigEditor channel={channel} onSaved={() => { refetch(); setExpandedId(null); }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
      <div
        className="rounded-xl p-4 text-xs space-y-1"
        style={{ background: "var(--accent)08", border: "1px solid var(--accent)20", color: "var(--fg-muted)" }}
      >
        <p className="font-medium" style={{ color: "var(--fg)" }}>When are alerts fired?</p>
        <p>• Integration fetch fails after a successful period (e.g., service unreachable)</p>
        <p>• Uptime Kuma monitor transitions to DOWN</p>
        <p>• Portainer container transitions to stopped</p>
        <p>• OPNsense gateway goes offline or shows packet loss</p>
        <p>• Any of the above recovers back to a healthy state</p>
      </div>
    </div>
  );
}

function ChannelConfigEditor({ channel, onSaved }: { channel: Channel; onSaved: () => void }) {
  const fields = CONFIG_FIELDS[channel.type as ChannelType] ?? [];
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const c: Record<string, string> = {};
    for (const f of fields) {
      c[f.key] = String((channel.config[f.key] as string) ?? "");
    }
    return c;
  });
  const [name, setName] = useState(channel.name);

  const update = trpc.notifications.channelUpdate.useMutation({ onSuccess: onSaved });

  function handleSave() {
    const cfg: Record<string, unknown> = {};
    for (const f of fields) {
      if (config[f.key]) cfg[f.key] = config[f.key];
    }
    update.mutate({ id: channel.id, name, config: cfg });
  }

  return (
    <div
      className="px-4 pb-4 space-y-3"
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="space-y-1 pt-3">
        <label className="text-xs" style={{ color: "var(--fg-muted)" }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
        />
      </div>
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {f.label}{f.optional && <span className="ml-1 opacity-50">(optional)</span>}
          </label>
          <input
            type={f.secret ? "password" : "text"}
            value={config[f.key] ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)" }}
          />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onSaved}
          className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/5 transition-all"
          style={{ color: "var(--fg-muted)" }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={update.isPending}
          className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          {update.isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
