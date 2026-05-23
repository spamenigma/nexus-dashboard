"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, TestTube2, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

const INTEGRATION_TYPES = [
  { id: "netdata", label: "Netdata", description: "System monitoring", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://mimas:19999" }, { key: "apiKey", label: "API Key (optional)", type: "password", placeholder: "" }] },
  { id: "uptime-kuma", label: "Uptime Kuma", description: "Uptime monitoring", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://mimas:3001" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "portainer", label: "Portainer", description: "Docker management", fields: [{ key: "url", label: "URL", type: "url", placeholder: "https://mimas:9443" }, { key: "apiToken", label: "API Token", type: "password", placeholder: "" }] },
  { id: "jellyfin", label: "Jellyfin", description: "Media server", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:8096" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "radarr", label: "Radarr", description: "Movie management", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:7878" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "sonarr", label: "Sonarr", description: "TV management", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:8989" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "sabnzbd", label: "SABnzbd", description: "Download client", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:8080" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "npmplus", label: "NPMPlus / NPM", description: "Reverse proxy", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://mimas:81" }, { key: "email", label: "Email", type: "text", placeholder: "" }, { key: "password", label: "Password", type: "password", placeholder: "" }] },
  { id: "jellyseerr", label: "Jellyseerr", description: "Media requests", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:5055" }, { key: "apiKey", label: "API Key", type: "password", placeholder: "" }] },
  { id: "wireguard-easy", label: "WireGuard Easy", description: "VPN peers", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://tethys:51821" }, { key: "password", label: "Password", type: "password", placeholder: "" }] },
  { id: "mqtt", label: "MQTT (Mosquitto)", description: "Home automation", fields: [{ key: "url", label: "Broker URL", type: "url", placeholder: "mqtt://tethys:1883" }, { key: "username", label: "Username (optional)", type: "text", placeholder: "" }, { key: "password", label: "Password (optional)", type: "password", placeholder: "" }] },
  { id: "imap", label: "Email (IMAP)", description: "Email monitoring", fields: [{ key: "host", label: "IMAP Host", type: "text", placeholder: "imap.gmail.com" }, { key: "port", label: "Port", type: "text", placeholder: "993" }, { key: "user", label: "Username", type: "text", placeholder: "" }, { key: "password", label: "Password / App Password", type: "password", placeholder: "" }] },
  { id: "openai", label: "OpenAI", description: "AI query widget", fields: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "sk-..." }] },
  { id: "anthropic", label: "Anthropic", description: "AI query widget", fields: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "sk-ant-..." }] },
  { id: "ollama", label: "Ollama", description: "Local AI", fields: [{ key: "url", label: "URL", type: "url", placeholder: "http://localhost:11434" }] },
  { id: "nextcloud", label: "Nextcloud", description: "File storage & activity", fields: [{ key: "url", label: "URL", type: "url", placeholder: "https://cloud.example.com" }, { key: "username", label: "Username", type: "text", placeholder: "" }, { key: "password", label: "App Password", type: "password", placeholder: "" }] },
  { id: "doku", label: "Docker API", description: "Disk usage (Docker TCP socket)", fields: [{ key: "url", label: "Docker API URL", type: "url", placeholder: "http://mimas:2375" }] },
  { id: "cloudflare", label: "Cloudflare DDNS", description: "DNS record monitoring", fields: [{ key: "apiToken", label: "API Token", type: "password", placeholder: "" }, { key: "zoneId", label: "Zone ID", type: "text", placeholder: "" }, { key: "recordId", label: "Record ID", type: "text", placeholder: "" }] },
  { id: "opnsense", label: "OPNsense", description: "Firewall gateway status", fields: [{ key: "url", label: "URL", type: "url", placeholder: "https://opnsense.lan" }, { key: "apiKey", label: "API Key", type: "text", placeholder: "" }, { key: "apiSecret", label: "API Secret", type: "password", placeholder: "" }] },
];

export default function IntegrationsPage() {
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState(INTEGRATION_TYPES[0].id);
  const [newName, setNewName] = useState("");
  const [newFields, setNewFields] = useState<Record<string, string>>({});

  const { data: integrations = [], refetch } = trpc.integrations.list.useQuery();
  const create = trpc.integrations.create.useMutation({ onSuccess: () => { refetch(); setAdding(false); setNewName(""); setNewFields({}); } });
  const remove = trpc.integrations.delete.useMutation({ onSuccess: () => refetch() });

  const selectedType = INTEGRATION_TYPES.find((t) => t.id === newType)!;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Integrations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Connect external services. Credentials are encrypted at rest.
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Existing integrations */}
      <div className="flex flex-col gap-2">
        {integrations.length === 0 && !adding && (
          <p className="text-sm text-center py-8" style={{ color: "var(--fg-muted)" }}>
            No integrations yet. Add one to start connecting your services.
          </p>
        )}
        {integrations.map((i) => (
          <div
            key={i.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-sm font-medium">{i.name}</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{i.type}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => remove.mutate({ id: i.id })}
                className="p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                style={{ color: "var(--fg-muted)" }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-col gap-4 p-4 rounded-2xl"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-semibold text-sm">New integration</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Service</label>
                <select
                  value={newType}
                  onChange={(e) => { setNewType(e.target.value); setNewFields({}); }}
                  className="input-field"
                >
                  {INTEGRATION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={`e.g. mimas ${selectedType.label}`}
                  className="input-field"
                />
              </div>
            </div>
            {selectedType.fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-xs uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{f.label}</label>
                <input
                  type={f.type}
                  value={newFields[f.key] ?? ""}
                  onChange={(e) => setNewFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="input-field"
                />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5" style={{ color: "var(--fg-muted)" }}>Cancel</button>
              <button
                onClick={() => create.mutate({ name: newName || `${selectedType.label}`, type: newType, config: newFields })}
                disabled={create.isPending}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                style={{ background: "var(--accent)", opacity: create.isPending ? 0.7 : 1 }}
              >
                {create.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
