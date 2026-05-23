# Nexus Dashboard — Project Proposal

> A self-hosted, fully UI-configured homelab dashboard. No config files. No SSH. Everything managed from within the app itself.

---

## 1. Goals

- Single browser tab that gives at-a-glance status across all homelab services
- 100% UI-driven configuration — add widgets, integrations, layouts, themes all from within the dashboard
- Clean, dark, animated modern aesthetic
- Runs in Docker (single container, optionally replicated)
- Designed specifically around the mimas + tethys environment but generic enough to support any homelab

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | SSR + API routes in one process; excellent ecosystem |
| Styling | Tailwind CSS + CSS custom properties | Dark theme, utility-first, runtime theming |
| Animation | Framer Motion | Polished widget transitions, drag physics |
| Widget layout | React Grid Layout | Drag-and-drop grid, resizable widgets, layout persistence |
| State | Zustand | Lightweight, no boilerplate |
| Backend API | Next.js API routes + tRPC | Type-safe end-to-end, no separate server process |
| Database | SQLite via Prisma | File-based, zero setup, Docker-volume-backed; swap to Postgres for HA |
| Real-time push | Server-Sent Events (SSE) | Live widget refresh without WebSocket overhead |
| Secrets | AES-256 encrypted in DB | API keys/passwords never stored plain |
| Auth | PIN + optional TOTP | Lightweight, no user account system needed |
| Container | Docker multi-stage build | Small final image (~200MB), single volume mount |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser                                            │
│  ┌──────────────────────────────────────────────┐   │
│  │  Grid Canvas (React Grid Layout)             │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │   │
│  │  │Widget│ │Widget│ │Widget│ │Widget│  ...   │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘       │   │
│  │  [Edit Mode] [+ Add Widget] [Settings]       │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / SSE
┌────────────────────▼────────────────────────────────┐
│  Next.js Server (Docker container)                  │
│                                                     │
│  tRPC API ──► Widget Config CRUD                    │
│            ──► Integration Config (encrypted)       │
│            ──► Layout persistence                   │
│            ──► Theme settings                       │
│                                                     │
│  Integration Poller (background) ──► SSE push       │
│    polls Netdata / Uptime Kuma / Portainer / etc.   │
│    caches results, pushes diffs to SSE stream       │
│                                                     │
│  SQLite (Prisma) ── /data/nexus.db (volume)        │
└─────────────────────────────────────────────────────┘
```

---

## 4. Widget Catalogue

### Core / Always Available
| Widget | Description |
|---|---|
| Clock | Time, date, timezone — always visible |
| Search Bar | Multi-engine: Google, DuckDuckGo, Perplexity, custom |
| Quick Links | App launcher — icon, label, URL, category, colour |
| iFrame Embed | Embed any internal page |
| Webhook Receiver | Accept POST, display last payload formatted |
| Markdown / Notes | Static info panel, announcements |

### Monitoring
| Widget | Integration |
|---|---|
| System Stats | Netdata — CPU, RAM, disk, network per host (mimas, tethys) |
| Uptime / Status | Uptime Kuma — service status badges, response times, incidents |
| Docker Manager | Portainer API — container list, status, start/stop/restart |
| Disk Usage | Doku API — Docker volume/image breakdown |
| Download Queue | SABnzbd — active NZB downloads, speed, queue |

### Media
| Widget | Integration |
|---|---|
| Now Playing | Jellyfin — active sessions |
| Recent Media | Jellyfin — recently added movies/shows |
| Media Requests | Jellyseerr — pending/approved requests |
| Sonarr Queue | Sonarr — upcoming episode downloads |
| Radarr Queue | Radarr — upcoming movie downloads |

### Infrastructure / Security
| Widget | Integration |
|---|---|
| Proxy Status | NPMPlus / NginxProxyManager — proxy hosts, cert expiry |
| Firewall Alerts | OPNsense API (future) — blocked IPs, rule hits |
| VPN Peers | WireGuard-Easy — connected peers, last handshake |
| MQTT Monitor | Mosquitto — topic subscriber, home automation states |
| DDNS Status | Cloudflare API — current resolved IP |

### Project / Apps
| Widget | Integration |
|---|---|
| Command Portal | Health check + container status for the full suite |
| Pathfinders Status | LiveKit + Discord bot + TS bot health |
| Timetracker | Summary of recent time entries (if API available) |

### Comms / AI
| Widget | Integration |
|---|---|
| Email Watch | IMAP / Gmail API — filtered view of flagged senders |
| AI Query | Anthropic / OpenAI / Ollama — query from dashboard |
| Nextcloud Activity | Recent file activity / notifications |

---

## 5. UI Configuration System

### Grid / Layout
- **Edit Mode** toggle (lock icon in header)
- In Edit Mode: widgets become draggable, resizable, show delete button
- Multiple saved **Pages** (tabs) — e.g. "Overview", "Media", "Infra"
- Layout auto-saves on drag/resize

### Widget Management
- **+ Add Widget** → modal → pick category + type → fill settings form → appears on grid
- Each widget has an individual settings drawer (gear icon, Edit Mode only)
- Settings forms are type-aware — Netdata widget shows "host URL, API key" fields; Docker widget shows "Portainer URL, token" fields

### Integration Hub (Settings → Integrations)
- Central registry of all external service connections
- Add a connection once (e.g. "mimas Netdata") — reuse across multiple widgets
- Credentials stored AES-256 encrypted in SQLite
- Test connection button per integration
- Never exposes raw secrets in the UI after save

### Appearance (Settings → Theme)
- Accent colour picker
- Background: solid, gradient, image upload, or animated gradient
- Widget style: glassmorphism / solid / minimal
- Widget opacity and blur sliders
- Font size scale

### Security
- PIN to access Settings (4–8 digits)
- Optional TOTP (authenticator app)
- Session timeout configuration
- Option to require PIN for view-only access too (for public-facing or less trusted networks)

---

## 6. Docker Deployment

### Single node
```yaml
services:
  nexus:
    image: nexus-dashboard:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}   # only secret needed at deploy time
    restart: unless-stopped
```

### Redundant pair (via NPMPlus sticky sessions)
```yaml
services:
  nexus-1:
    image: nexus-dashboard:latest
    volumes:
      - ./data:/data          # shared NFS/SMB volume between nodes
  nexus-2:
    image: nexus-dashboard:latest
    volumes:
      - ./data:/data
```

Single volume mount: `/data` contains SQLite DB + uploaded assets. Backup = copy one folder.

---

## 7. Build Phases

### Phase 1 — Foundation (build now)
- Next.js 15 + TypeScript + Tailwind + Framer Motion scaffold
- Prisma + SQLite schema (widgets, layouts, integrations, settings)
- tRPC API layer
- PIN auth + session
- Grid canvas with Edit Mode (drag, resize, add, delete)
- Widget registry (plugin architecture — new widget = new folder)
- First widgets: Clock, Quick Links, Search Bar, iFrame, Webhook Display, Markdown
- Docker multi-stage build + docker-compose
- Settings shell (Integrations page, Theme page)

### Phase 2 — Monitoring Core
- Netdata integration (both hosts)
- Uptime Kuma integration
- Portainer / Docker Manager widget
- System Stats widget
- Doku disk widget
- SABnzbd download widget

### Phase 3 — Media Stack
- Jellyfin (Now Playing + Recent)
- Radarr + Sonarr queues
- Jellyseerr requests

### Phase 4 — Infrastructure & Security
- NPMPlus / NginxProxyManager cert + host status
- WireGuard-Easy peer status
- MQTT topic monitor (Mosquitto)
- Cloudflare DDNS

### Phase 5 — Project & Comms
- Command Portal suite health widget
- Pathfinders (LiveKit + bots) status
- Email Watch (IMAP)
- AI Query widget (Anthropic/OpenAI/Ollama)
- Nextcloud activity

### Phase 6 — Polish & HA
- Animated background options
- Advanced theming
- Page/tab system
- Multi-language (if wanted)
- Postgres backend option
- Redundant container setup + shared volume docs
- OPNsense integration (firewall alerts)

---

## 8. What Is Intentionally Not Included (Phase 1)

- No user account system (single-owner homelab — PIN is sufficient)
- No mobile app (responsive web only)
- No plugin marketplace (internal plugin architecture, not public extensions)
- No config file import/export in Phase 1 (UI-first; export can come later)
