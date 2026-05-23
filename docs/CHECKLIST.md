# Nexus Dashboard — Build Checklist

Legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` skipped/deferred

---

## Phase 1 — Foundation ✅

### Project Scaffold
- [x] `npx create-next-app` with TypeScript, Tailwind, App Router
- [x] Configure path aliases (`@/components`, `@/lib`, `@/widgets`, etc.)
- [x] Install core deps: Framer Motion, tRPC, React Grid Layout v2
- [x] Install data deps: Prisma 7 + `@prisma/adapter-libsql` + `@libsql/client`
- [x] Install util deps: zod, date-fns, lucide-react
- [-] ESLint + Prettier config _(using Next.js defaults)_
- [-] Environment variable schema _(env validated in prisma.config.ts and crypto.ts)_

### Database (Prisma + SQLite via LibSQL)
- [x] `prisma/schema.prisma` with models: Integration, Widget, Page, Setting
- [x] Migration + seed script
- [x] Encryption helper (AES-256-GCM, key from `ENCRYPTION_KEY` env)

### tRPC API Layer
- [x] tRPC router setup (`/app/api/trpc/[trpc]/route.ts`)
- [x] `widgetRouter` — CRUD + updateLayout
- [x] `pageRouter` — CRUD for pages/tabs
- [x] `integrationRouter` — CRUD + test-connection
- [x] `settingRouter` — get/set theme, auth config
- [x] Layout save/load built into widgetRouter (`updateLayout` mutation)

### Auth
- [x] PIN setup flow (first-run wizard if no PIN set)
- [x] PIN verify endpoint + session cookie (HttpOnly, HMAC-SHA256 signed, 8h expiry)
- [x] Session middleware — protects `/settings` and mutation routes
- [-] TOTP enroll + verify _(deferred — PIN auth deemed sufficient)_
- [x] Session timeout (8-hour expiry, configurable via settings)

### Grid Canvas
- [x] Base grid page (`/app/page.tsx`) with React Grid Layout v2
- [x] Edit Mode toggle (lock/unlock icon in header)
- [x] Widget frame component (title bar, drag handle, delete + settings in edit mode)
- [x] Layout save on drag/resize (debounced tRPC call)
- [x] Layout load on page mount
- [x] Responsive width (tracks `window.innerWidth`)

### Widget Registry
- [x] Widget type registry (`/widgets/registry.ts`) — type → lazy component + config schema
- [x] Widget config drawer (slide-in panel, edit mode only)
- [x] "Add Widget" modal — category browser, search, Lucide icons, type picker → save
- [x] Widget error boundary (broken widget shows error card, page unaffected)
- [x] Widget loading skeleton (shimmer CSS)

### First Widgets
- [x] **Clock** — time, date, timezone, 12/24h, seconds toggle
- [x] **Quick Links** — favicon, label, URL, category, accent colour, new-tab toggle
- [x] **Search Bar** — engine selector, custom engines, placeholder config
- [x] **iFrame Embed** — URL, optional refresh interval
- [x] **Webhook Receiver** — unique endpoint per widget, last N payloads, JSON pretty-print
- [x] **Markdown / Notes** — static markdown content panel

### Settings Shell
- [x] Settings layout (`/app/settings/layout.tsx`) — PIN-gated
- [x] Integrations page — list, add, edit, delete, test-connection, masked secrets
- [x] Theme page — accent colour, background type, widget style
- [x] Auth page — change PIN
- [x] About page — version, Node.js version, uptime, pages/widgets/integrations counts

### Real-time (SSE)
- [x] SSE endpoint (`/app/api/stream/route.ts`) — named events per integration type
- [x] Integration poller (`lib/poller/engine.ts`) — background intervals per type
- [x] `useIntegrationData` hook — widget subscribes by `integrationId`
- [x] In-memory cache — poller writes cache, SSE pushes on update

### Docker
- [x] `Dockerfile` — multi-stage (builder → runner)
- [x] `.dockerignore`
- [x] `docker-compose.yml` — single node, volume mount for `/data`
- [x] `docker-compose.ha.yml` — two-node HA setup (shared volume, sticky sessions via reverse proxy)
- [x] Health check endpoint (`/api/health`)
- [x] Startup migration runner (Prisma migrate deploy on container start)

---

## Phase 2 — Monitoring Core ✅

### Netdata Integration
- [x] Integration type: `netdata` (URL + optional API key)
- [x] Poller: CPU, RAM, disk I/O, network rates
- [x] Widget: **System Stats** — progress bars, colour-coded thresholds, hostname + uptime
- [-] Sparkline charts _(kept simple for now — bar/rate display instead)_

### Uptime Kuma Integration
- [x] Integration type: `uptime-kuma` (URL + API key)
- [x] Poller: monitor status list
- [x] Widget: **Status Board** — coloured dots, response time, 30-day uptime %
- [x] Alert style: pulsing red glow on DOWN status

### Portainer / Docker Manager
- [x] Integration type: `portainer` (URL + API token)
- [x] Poller: container list
- [x] Widget: **Docker Manager** — container list, status dot, stack sub-label
- [x] Start / Stop / Restart actions (with `window.confirm()` guard)
- [x] `showStopped` toggle config

### Doku Disk Usage
- [x] Integration type: `doku` (Docker TCP API URL, e.g. `http://host:2375`)
- [x] Poller: `GET /system/df` — images, containers, volumes, build cache breakdown
- [x] Widget: **Docker Disk Usage** — per-category size + reclaimable, formatted bytes

### SABnzbd
- [x] Integration type: `sabnzbd` (URL + API key)
- [x] Poller: queue endpoint (polls every 10s)
- [x] Widget: **Download Queue** — speed, MB left, ETA, active slots

---

## Phase 3 — Media Stack ✅

### Jellyfin
- [x] Integration type: `jellyfin` (URL + API key)
- [x] Widget: **Now Playing** — active sessions, user, title, progress bar
- [x] Widget: **Recently Added** — poster images, title, date

### Radarr
- [x] Integration type: `radarr` (URL + API key)
- [x] Widget: **Radarr Queue** — download queue + 7-day calendar

### Sonarr
- [x] Integration type: `sonarr` (URL + API key)
- [x] Widget: **Sonarr Queue** — download queue + upcoming episodes (S01E01 format)

### Jellyseerr
- [x] Integration type: `jellyseerr` (URL + API key)
- [x] Widget: **Media Requests** — pending/approved/available requests, poster images
- [x] `filter` config (all / pending only)

---

## Phase 4 — Infrastructure & Security ✅

### NPMPlus / Nginx Proxy Manager
- [x] Integration type: `npmplus` (URL + email + password)
- [x] Poller: re-authenticates each poll, fetches proxy hosts + cert expiry
- [x] Widget: **Proxy Status** — cert expiry warnings (red < 14d, amber < 30d)

### WireGuard-Easy
- [x] Integration type: `wireguard-easy` (URL + password)
- [x] Poller: peer list, online = last handshake < 3 min ago
- [x] Widget: **VPN Peers** — online/offline, transfer stats

### Health Check _(added, not in original plan)_
- [x] Server-side ping endpoint (`/api/health-check`) — avoids CORS, 5s timeout
- [x] Widget: **Health Check** — ping any URLs, UP/DOWN + latency, configurable interval

### MQTT Monitor
- [x] Integration type: `mqtt` (broker URL, optional username/password)
- [x] Persistent MQTT client manager (`lib/poller/fetchers/mqtt-client.ts`) — not polled, stays connected
- [x] Widget: **MQTT Topics** — live topic values, connection status, formatted timestamps

### Cloudflare DDNS
- [x] Integration type: `cloudflare` (API token, zone ID, record ID)
- [x] Poller: Cloudflare DNS record + ipify public IP comparison (every 5 min)
- [x] Widget: **Cloudflare DDNS** — DNS record IP vs public IP, in-sync indicator

### OPNsense
- [x] Integration type: `opnsense` (URL, API key, API secret)
- [x] Poller: gateway status via REST API + HTTP Basic auth (polls every 30s)
- [x] Widget: **OPNsense Gateways** — gateway list, latency, packet loss, online/offline/loss status

---

## Phase 5 — Project & Comms ✅

### Command Portal Suite
- [-] Widget: **Command Portal** health check _(can use Health Check widget + Portainer filter instead)_

### Pathfinders Status
- [-] Widget: **Pathfinders** — LiveKit, Discord bot, TS bot status _(not implemented — use Health Check widget)_

### Email Watch
- [x] Integration type: `imap` (host, port, user, password, extra folders)
- [x] Uses `imapflow` library; `rejectUnauthorized: false` for self-signed homelab certs
- [x] Widget: **Email (IMAP)** — unread count per folder, total messages

### AI Query
- [x] Integration types: `openai`, `anthropic`, `ollama`
- [x] Widget: **AI Query** — chat input, message history, model label
- [x] Anthropic: default `claude-haiku-4-5-20251001`; Ollama: default `llama3.2`; OpenAI: default `gpt-4o-mini`

### Nextcloud Activity
- [x] Integration type: `nextcloud` (URL + username + app password)
- [x] Widget: **Nextcloud Activity** — recent file activity feed, storage usage bar

---

## Phase 6 — Polish ✅

### Appearance
- [x] Animated gradient background (20s CSS keyframe, `bg-animated-gradient`)
- [x] Background solid colour and image URL options
- [x] Glass/blur widget style (`backdrop-filter`, `.widget-glass`)
- [x] Solid and minimal widget style variants
- [x] Widget opacity slider (40–100%)
- [x] Font scale slider (80–130%, step 5%)
- [x] Custom CSS injection (Settings → Theme → textarea, live-injected via `<style>` tag)
- [-] Per-widget accent colour override _(deferred)_

### Pages / Tabs
- [x] Multiple named pages (create, rename, delete from header)
- [x] Tab bar in header — active indicator, inline rename/delete in edit mode
- [x] Inline page creation (no browser `prompt()`) with animated input
- [x] Animated page transitions (Framer Motion `AnimatePresence`, fade + slide)
- [x] Empty state per page (contextual CTA based on edit mode)
- [x] Drag to reorder pages (HTML5 drag API, swaps `order` values via tRPC)
- [-] Page-specific background override _(deferred)_

### Config & Backup
- [x] Config export — JSON dump of pages + widgets + theme (no integration secrets)
- [x] Config import — destructive replace with JSON file, auth settings never overwritten
- [x] Settings → Backup page with export button and import file input

### Keyboard Shortcuts
- [x] `e` — toggle edit mode
- [x] `Esc` — exit edit mode
- [x] `1`–`9` — jump to page by index

### High Availability
- [x] `docker-compose.ha.yml` — two-node redundant pair sharing `/data` volume
- [-] Postgres backend option _(SQLite WAL handles concurrent reads fine for homelab scale)_

### Misc
- [x] Lucide icons throughout (widget modal, header, all UI — no emoji)
- [x] About page (Settings → About) — version, Node.js, uptime, entity counts

---

## Remaining / Backlog

| Item | Priority | Notes |
|---|---|---|
| Per-widget accent colour override | Low | Deferred — CSS variables approach would need widget-level scope |
| Page-specific background override | Low | Deferred — theme applies globally |
| Postgres backend option | Low | SQLite WAL + shared volume sufficient for homelab |
| Notifications panel (aggregated alerts) | Medium | Unread badge + slide-out panel for all DOWN/error events |
| TOTP auth | Low | PIN auth deemed sufficient; TOTP would add significant complexity |
| Pathfinders Status widget | Medium | Custom widget for LiveKit/Discord bot/TS bot — use Health Check for now |
