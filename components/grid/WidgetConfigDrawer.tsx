"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { getWidget } from "@/widgets/registry";

interface DbWidget {
  id: string;
  type: string;
  title: string;
  config: string;
}

export function WidgetConfigDrawer({ widget, onClose }: { widget: DbWidget; onClose: () => void }) {
  const meta = getWidget(widget.type);
  const [title, setTitle] = useState(widget.title);
  const [config, setConfig] = useState<Record<string, unknown>>(
    JSON.parse(widget.config)
  );

  const update = trpc.widgets.update.useMutation({ onSuccess: onClose });

  function save() {
    update.mutate({ id: widget.id, title, config });
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.6)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.aside
        className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col overflow-hidden"
        style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
      >
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="font-semibold text-sm">{meta?.label ?? widget.type}</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Widget settings</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "var(--fg-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <Field label="Title">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="Widget title (optional)"
            />
          </Field>

          <ConfigFields type={widget.type} config={config} onChange={setConfig} />
        </div>

        <div className="p-4 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={save}
            disabled={update.isPending}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--accent)",
              color: "#fff",
              opacity: update.isPending ? 0.7 : 1,
            }}
          >
            <Save size={14} />
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ConfigFields({
  type, config, onChange,
}: {
  type: string;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  function set(key: string, value: unknown) {
    onChange({ ...config, [key]: value });
  }

  switch (type) {
    case "clock":
      return (
        <>
          <Field label="Timezone">
            <input type="text" value={(config.timezone as string) ?? "local"} onChange={(e) => set("timezone", e.target.value)} className="input-field w-full" placeholder="e.g. Europe/London" />
          </Field>
          <Toggle label="Show seconds" value={config.showSeconds !== false} onChange={(v) => set("showSeconds", v)} />
          <Toggle label="Show date" value={config.showDate !== false} onChange={(v) => set("showDate", v)} />
          <Toggle label="24-hour format" value={config.format24h !== false} onChange={(v) => set("format24h", v)} />
        </>
      );

    case "quick-links":
      return <QuickLinksConfig config={config} onChange={onChange} />;

    case "search-bar":
      return (
        <>
          <Field label="Default engine">
            <select value={(config.engine as string) ?? "duckduckgo"} onChange={(e) => set("engine", e.target.value)} className="input-field w-full">
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="google">Google</option>
              <option value="bing">Bing</option>
              <option value="perplexity">Perplexity</option>
            </select>
          </Field>
          <Field label="Placeholder text">
            <input type="text" value={(config.placeholder as string) ?? "Search…"} onChange={(e) => set("placeholder", e.target.value)} className="input-field w-full" />
          </Field>
          <Toggle label="Open in new tab" value={config.openInNewTab !== false} onChange={(v) => set("openInNewTab", v)} />
        </>
      );

    case "iframe-embed":
      return (
        <>
          <Field label="URL">
            <input type="url" value={(config.url as string) ?? ""} onChange={(e) => set("url", e.target.value)} className="input-field w-full" placeholder="https://..." />
          </Field>
          <Field label="Auto-refresh (seconds, 0 = off)">
            <input type="number" min={0} value={(config.refreshInterval as number) ?? 0} onChange={(e) => set("refreshInterval", Number(e.target.value))} className="input-field w-full" />
          </Field>
        </>
      );

    case "markdown-note":
      return (
        <Field label="Content (Markdown)">
          <textarea
            value={(config.content as string) ?? ""}
            onChange={(e) => set("content", e.target.value)}
            rows={10}
            className="input-field w-full font-mono text-xs resize-none"
          />
        </Field>
      );

    case "webhook-receiver":
      return (
        <>
          <Field label="Max history (1–50)">
            <input type="number" min={1} max={50} value={(config.maxHistory as number) ?? 10} onChange={(e) => set("maxHistory", Number(e.target.value))} className="input-field w-full" />
          </Field>
          <Toggle label="Show timestamp" value={config.showTimestamp !== false} onChange={(v) => set("showTimestamp", v)} />
        </>
      );

    case "netdata":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="netdata"
          label="Netdata instance"
        />
      );

    case "uptime-kuma":
      return (
        <>
          <IntegrationSelect
            value={(config.integrationId as string) ?? ""}
            onChange={(id) => set("integrationId", id)}
            filterType="uptime-kuma"
            label="Uptime Kuma instance"
          />
          <Field label="Max monitors">
            <input
              type="number"
              min={1}
              max={100}
              value={(config.maxItems as number) ?? 30}
              onChange={(e) => set("maxItems", Number(e.target.value))}
              className="input-field w-full"
            />
          </Field>
          <Toggle label="Show response time" value={config.showResponseTime !== false} onChange={(v) => set("showResponseTime", v)} />
        </>
      );

    case "portainer":
      return (
        <>
          <IntegrationSelect
            value={(config.integrationId as string) ?? ""}
            onChange={(id) => set("integrationId", id)}
            filterType="portainer"
            label="Portainer instance"
          />
          <Toggle label="Show stopped containers" value={config.showStopped !== false} onChange={(v) => set("showStopped", v)} />
        </>
      );

    case "jellyfin":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="jellyfin"
          label="Jellyfin instance"
        />
      );

    case "radarr":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="radarr"
          label="Radarr instance"
        />
      );

    case "sonarr":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="sonarr"
          label="Sonarr instance"
        />
      );

    case "jellyseerr":
      return (
        <>
          <IntegrationSelect
            value={(config.integrationId as string) ?? ""}
            onChange={(id) => set("integrationId", id)}
            filterType="jellyseerr"
            label="Jellyseerr instance"
          />
          <Field label="Filter">
            <select value={(config.filter as string) ?? "all"} onChange={(e) => set("filter", e.target.value)} className="input-field w-full">
              <option value="all">All requests</option>
              <option value="pending">Pending only</option>
            </select>
          </Field>
        </>
      );

    case "sabnzbd":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="sabnzbd"
          label="SABnzbd instance"
        />
      );

    case "npmplus":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="npmplus"
          label="NPMPlus instance"
        />
      );

    case "wireguard-easy":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="wireguard-easy"
          label="WireGuard Easy instance"
        />
      );

    case "health-check":
      return <HealthCheckConfig config={config} onChange={onChange} />;

    case "ai-query":
      return (
        <>
          <AIIntegrationSelect
            value={(config.integrationId as string) ?? ""}
            onChange={(id) => set("integrationId", id)}
          />
          <Field label="Default model (optional)">
            <input
              type="text"
              value={(config.defaultModel as string) ?? ""}
              onChange={(e) => set("defaultModel", e.target.value)}
              className="input-field w-full"
              placeholder="e.g. gpt-4o-mini, claude-haiku-4-5-20251001, llama3.2"
            />
          </Field>
          <Field label="System prompt (optional)">
            <textarea
              value={(config.systemPrompt as string) ?? ""}
              onChange={(e) => set("systemPrompt", e.target.value)}
              rows={3}
              className="input-field w-full text-xs resize-none"
              placeholder="You are a helpful homelab assistant."
            />
          </Field>
        </>
      );

    case "nextcloud":
      return (
        <>
          <IntegrationSelect
            value={(config.integrationId as string) ?? ""}
            onChange={(id) => set("integrationId", id)}
            filterType="nextcloud"
            label="Nextcloud instance"
          />
          <Field label="Max items">
            <input
              type="number"
              min={1}
              max={50}
              value={(config.maxItems as number) ?? 15}
              onChange={(e) => set("maxItems", Number(e.target.value))}
              className="input-field w-full"
            />
          </Field>
        </>
      );

    case "imap":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="imap"
          label="Email account"
        />
      );

    case "doku":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="doku"
          label="Docker host"
        />
      );

    case "cloudflare":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="cloudflare"
          label="Cloudflare account"
        />
      );

    case "opnsense":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="opnsense"
          label="OPNsense firewall"
        />
      );

    case "mqtt":
      return (
        <IntegrationSelect
          value={(config.integrationId as string) ?? ""}
          onChange={(id) => set("integrationId", id)}
          filterType="mqtt"
          label="MQTT broker"
        />
      );

    default:
      return (
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          This widget has no configurable options.
        </p>
      );
  }
}

interface QuickLink {
  id: string;
  label: string;
  url: string;
  color?: string;
  category?: string;
  newTab?: boolean;
}

function QuickLinksConfig({
  config, onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const links = ((config.links ?? []) as QuickLink[]);
  const [editing, setEditing] = useState<QuickLink | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<QuickLink>>({});

  function set(key: string, value: unknown) {
    onChange({ ...config, [key]: value });
  }

  function saveLink() {
    if (!draft.label || !draft.url) return;
    const link: QuickLink = {
      id: editing?.id ?? crypto.randomUUID(),
      label: draft.label,
      url: draft.url,
      color: draft.color || undefined,
      category: draft.category || undefined,
      newTab: draft.newTab !== false,
    };
    const next = editing
      ? links.map((l) => (l.id === editing.id ? link : l))
      : [...links, link];
    set("links", next);
    setEditing(null);
    setAdding(false);
    setDraft({});
  }

  function removeLink(id: string) {
    set("links", links.filter((l) => l.id !== id));
  }

  function startEdit(link: QuickLink) {
    setEditing(link);
    setAdding(false);
    setDraft({ ...link });
  }

  function startAdd() {
    setAdding(true);
    setEditing(null);
    setDraft({ newTab: true });
  }

  const showForm = adding || editing !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Links ({links.length})</span>
        <button
          onClick={startAdd}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "var(--accent)20", color: "var(--accent)", border: "1px solid var(--accent)30" }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Link list */}
      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {links.length === 0 && !showForm && (
          <p className="text-xs text-center py-3" style={{ color: "var(--fg-muted)" }}>No links yet — click Add.</p>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: "var(--bg-elevated)", border: `1px solid ${editing?.id === link.id ? "var(--accent)" : "var(--border)"}` }}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: link.color ?? "var(--accent)" }}
            />
            <span className="text-xs flex-1 truncate">{link.label}</span>
            <span className="text-xs truncate max-w-[80px]" style={{ color: "var(--fg-muted)" }}>
              {link.url.replace(/^https?:\/\//, "").split("/")[0]}
            </span>
            <button onClick={() => startEdit(link)} className="p-0.5 hover:text-white transition-colors" style={{ color: "var(--fg-muted)" }}>
              <Save size={12} />
            </button>
            <button onClick={() => removeLink(link.id)} className="p-0.5 hover:text-red-400 transition-colors" style={{ color: "var(--fg-muted)" }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)30" }}>
          <p className="text-xs font-medium" style={{ color: "var(--accent)" }}>
            {editing ? "Edit link" : "New link"}
          </p>
          <input
            type="text"
            placeholder="Label"
            value={draft.label ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="input-field text-xs"
          />
          <input
            type="url"
            placeholder="URL (https://...)"
            value={draft.url ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            className="input-field text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Category (optional)"
              value={draft.category ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="input-field text-xs"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: "var(--fg-muted)" }}>Colour</label>
              <input
                type="color"
                value={draft.color ?? "#6366f1"}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                className="h-7 w-10 rounded cursor-pointer border-0 bg-transparent p-0"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Toggle label="Open in new tab" value={draft.newTab !== false} onChange={(v) => setDraft((d) => ({ ...d, newTab: v }))} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setEditing(null); setDraft({}); }}
              className="flex-1 py-1.5 rounded-lg text-xs"
              style={{ color: "var(--fg-muted)", border: "1px solid var(--border)" }}
            >
              Cancel
            </button>
            <button
              onClick={saveLink}
              disabled={!draft.label || !draft.url}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ background: "var(--accent)", opacity: (!draft.label || !draft.url) ? 0.5 : 1 }}
            >
              {editing ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
        <Toggle label="Show categories" value={config.showCategories === true} onChange={(v) => set("showCategories", v)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Icon size</label>
        <select value={(config.iconSize as string) ?? "md"} onChange={(e) => set("iconSize", e.target.value)} className="input-field text-xs">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </div>
    </div>
  );
}

interface HealthCheck { id: string; name: string; url: string }

const AI_TYPES = ["openai", "anthropic", "ollama"];

function AIIntegrationSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data: integrations } = trpc.integrations.list.useQuery();
  const aiIntegrations = (integrations ?? []).filter((i) => AI_TYPES.includes(i.type));
  return (
    <Field label="AI provider">
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field w-full">
        <option value="">— select provider —</option>
        {aiIntegrations.map((i) => (
          <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
        ))}
      </select>
      {aiIntegrations.length === 0 && (
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Add an OpenAI, Anthropic, or Ollama integration in Settings.
        </p>
      )}
    </Field>
  );
}

function HealthCheckConfig({
  config, onChange,
}: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const checks = ((config.checks ?? []) as HealthCheck[]);
  const [draft, setDraft] = useState<Partial<HealthCheck>>({});
  const [adding, setAdding] = useState(false);

  function set(key: string, value: unknown) { onChange({ ...config, [key]: value }); }

  function addCheck() {
    if (!draft.name || !draft.url) return;
    const next: HealthCheck = { id: crypto.randomUUID(), name: draft.name, url: draft.url };
    set("checks", [...checks, next]);
    setDraft({});
    setAdding(false);
  }

  function removeCheck(id: string) { set("checks", checks.filter((c) => c.id !== id)); }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>URLs ({checks.length})</span>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
          style={{ background: "var(--accent)20", color: "var(--accent)", border: "1px solid var(--accent)30" }}
        >
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {checks.map((c) => (
          <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <span className="flex-1 truncate font-medium">{c.name}</span>
            <span className="truncate max-w-[100px]" style={{ color: "var(--fg-muted)" }}>{c.url.replace(/^https?:\/\//, "")}</span>
            <button onClick={() => removeCheck(c.id)} className="p-0.5 hover:text-red-400 transition-colors" style={{ color: "var(--fg-muted)" }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        {checks.length === 0 && !adding && (
          <p className="text-xs text-center py-2" style={{ color: "var(--fg-muted)" }}>No checks yet</p>
        )}
      </div>

      {adding && (
        <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent)30" }}>
          <input type="text" placeholder="Name (e.g. Command Portal)" value={draft.name ?? ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} className="input-field text-xs" />
          <input type="url" placeholder="URL (https://...)" value={draft.url ?? ""} onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))} className="input-field text-xs" />
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setDraft({}); }} className="flex-1 py-1.5 rounded-lg text-xs" style={{ color: "var(--fg-muted)", border: "1px solid var(--border)" }}>Cancel</button>
            <button onClick={addCheck} disabled={!draft.name || !draft.url} className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "var(--accent)", opacity: (!draft.name || !draft.url) ? 0.5 : 1 }}>Add</button>
          </div>
        </div>
      )}

      <Field label="Refresh every (seconds)">
        <input type="number" min={5} max={300} value={(config.refreshInterval as number) ?? 30} onChange={(e) => set("refreshInterval", Number(e.target.value))} className="input-field w-full" />
      </Field>
    </div>
  );
}

function IntegrationSelect({
  value, onChange, filterType, label,
}: {
  value: string;
  onChange: (id: string) => void;
  filterType: string;
  label: string;
}) {
  const { data: integrations } = trpc.integrations.list.useQuery();
  const filtered = (integrations ?? []).filter((i) => i.type === filterType);

  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field w-full">
        <option value="">— select integration —</option>
        {filtered.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      {filtered.length === 0 && (
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          No {filterType} integrations yet. Add one in Settings → Integrations.
        </p>
      )}
    </Field>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--fg)" }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="w-10 h-6 rounded-full transition-colors relative"
        style={{ background: value ? "var(--accent)" : "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
          style={{
            background: "#fff",
            transform: value ? "translateX(1.1rem)" : "translateX(0.1rem)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </button>
    </div>
  );
}
