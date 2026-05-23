// Auto-registers all widgets. Import this once at the app root.
import { registerWidget } from "./registry";
import { z } from "zod";

registerWidget({
  type: "clock",
  label: "Clock",
  description: "Date and time display with configurable timezone and format",
  category: "core",
  icon: "clock",
  defaultW: 3,
  defaultH: 2,
  minW: 2,
  minH: 2,
  configSchema: z.object({
    timezone: z.string().default("local"),
    showSeconds: z.boolean().default(true),
    showDate: z.boolean().default(true),
    format24h: z.boolean().default(true),
  }),
  component: () => import("./clock"),
});

registerWidget({
  type: "quick-links",
  label: "Quick Links",
  description: "App launcher with icons, categories, and custom colours",
  category: "core",
  icon: "grid",
  defaultW: 4,
  defaultH: 3,
  minW: 2,
  minH: 2,
  configSchema: z.object({
    links: z.array(z.object({
      id: z.string(),
      label: z.string(),
      url: z.string().url(),
      icon: z.string().optional(),
      color: z.string().optional(),
      category: z.string().optional(),
      newTab: z.boolean().default(true),
    })).default([]),
    showCategories: z.boolean().default(false),
    iconSize: z.enum(["sm", "md", "lg"]).default("md"),
  }),
  component: () => import("./quick-links"),
});

registerWidget({
  type: "search-bar",
  label: "Search Bar",
  description: "Multi-engine search with keyboard shortcut",
  category: "core",
  icon: "search",
  defaultW: 6,
  defaultH: 2,
  minW: 3,
  minH: 2,
  configSchema: z.object({
    engine: z.string().default("duckduckgo"),
    customEngines: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
    })).default([]),
    placeholder: z.string().default("Search…"),
    openInNewTab: z.boolean().default(true),
  }),
  component: () => import("./search-bar"),
});

registerWidget({
  type: "iframe-embed",
  label: "iFrame Embed",
  description: "Embed any internal URL in a widget",
  category: "core",
  icon: "monitor",
  defaultW: 6,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    url: z.string().url(),
    refreshInterval: z.number().min(0).default(0),
  }),
  component: () => import("./iframe-embed"),
});

registerWidget({
  type: "webhook-receiver",
  label: "Webhook Receiver",
  description: "Accept POST requests and display the last payload",
  category: "core",
  icon: "webhook",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    maxHistory: z.number().min(1).max(50).default(10),
    showTimestamp: z.boolean().default(true),
  }),
  component: () => import("./webhook-receiver"),
});

registerWidget({
  type: "markdown-note",
  label: "Note / Markdown",
  description: "Static markdown content panel",
  category: "core",
  icon: "file-text",
  defaultW: 4,
  defaultH: 3,
  minW: 2,
  minH: 2,
  configSchema: z.object({
    content: z.string().default("# Note\n\nAdd your content here."),
  }),
  component: () => import("./markdown-note"),
});

registerWidget({
  type: "netdata",
  label: "Netdata",
  description: "Live CPU, RAM, disk, and network stats from a Netdata instance",
  category: "monitoring",
  icon: "activity",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./netdata"),
});

registerWidget({
  type: "uptime-kuma",
  label: "Uptime Kuma",
  description: "Service status board from Uptime Kuma — shows uptime %, response time, and alerts",
  category: "monitoring",
  icon: "heart-pulse",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
    maxItems: z.number().min(1).max(100).default(30),
    showResponseTime: z.boolean().default(true),
  }),
  component: () => import("./uptime-kuma"),
});

registerWidget({
  type: "portainer",
  label: "Portainer",
  description: "Docker container manager — view status, start, stop, and restart containers",
  category: "monitoring",
  icon: "container",
  defaultW: 5,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
    showStopped: z.boolean().default(true),
  }),
  component: () => import("./portainer"),
});

registerWidget({
  type: "jellyfin",
  label: "Jellyfin",
  description: "Now playing sessions and recently added media from Jellyfin",
  category: "media",
  icon: "play-circle",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./jellyfin"),
});

registerWidget({
  type: "radarr",
  label: "Radarr",
  description: "Movie download queue and upcoming cinema/digital releases",
  category: "media",
  icon: "film",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./radarr"),
});

registerWidget({
  type: "sonarr",
  label: "Sonarr",
  description: "TV episode download queue and episodes airing this week",
  category: "media",
  icon: "tv",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./sonarr"),
});

registerWidget({
  type: "jellyseerr",
  label: "Jellyseerr",
  description: "Media request queue — track pending, approved, and available requests",
  category: "media",
  icon: "inbox",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
    filter: z.enum(["all", "pending"]).default("all"),
  }),
  component: () => import("./jellyseerr"),
});

registerWidget({
  type: "sabnzbd",
  label: "SABnzbd",
  description: "Usenet download client — queue, speed, and progress",
  category: "infrastructure",
  icon: "arrow-down-circle",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./sabnzbd"),
});

registerWidget({
  type: "npmplus",
  label: "Nginx Proxy Manager",
  description: "Proxy host list with SSL certificate expiry status",
  category: "infrastructure",
  icon: "shield",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./npmplus"),
});

registerWidget({
  type: "wireguard-easy",
  label: "WireGuard",
  description: "VPN peer status — shows online/offline peers and transfer stats",
  category: "infrastructure",
  icon: "lock",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./wireguard"),
});

registerWidget({
  type: "health-check",
  label: "Health Check",
  description: "Ping any URLs and show UP/DOWN status with latency",
  category: "infrastructure",
  icon: "heart",
  defaultW: 3,
  defaultH: 4,
  minW: 2,
  minH: 2,
  configSchema: z.object({
    checks: z.array(z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
    })).default([]),
    refreshInterval: z.number().min(5).max(300).default(30),
  }),
  component: () => import("./health-check"),
});

registerWidget({
  type: "ai-query",
  label: "AI Query",
  description: "Ask questions to OpenAI, Anthropic, or Ollama from your dashboard",
  category: "comms",
  icon: "sparkles",
  defaultW: 5,
  defaultH: 5,
  minW: 3,
  minH: 4,
  configSchema: z.object({
    integrationId: z.string().optional(),
    systemPrompt: z.string().default(""),
    defaultModel: z.string().default(""),
  }),
  component: () => import("./ai-query"),
});

registerWidget({
  type: "nextcloud",
  label: "Nextcloud",
  description: "Recent file activity and storage usage from Nextcloud",
  category: "comms",
  icon: "cloud",
  defaultW: 4,
  defaultH: 5,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
    maxItems: z.number().min(1).max(50).default(15),
  }),
  component: () => import("./nextcloud"),
});

registerWidget({
  type: "imap",
  label: "Email (IMAP)",
  description: "Unread email count per folder from any IMAP mailbox",
  category: "comms",
  icon: "mail",
  defaultW: 3,
  defaultH: 3,
  minW: 2,
  minH: 2,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./imap"),
});

registerWidget({
  type: "doku",
  label: "Docker Disk Usage",
  description: "Docker image, container, volume, and build cache disk breakdown",
  category: "monitoring",
  icon: "hard-drive",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./doku"),
});

registerWidget({
  type: "cloudflare",
  label: "Cloudflare DDNS",
  description: "DNS record vs public IP — shows if your DDNS is in sync",
  category: "infrastructure",
  icon: "cloud",
  defaultW: 3,
  defaultH: 4,
  minW: 2,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./cloudflare"),
});

registerWidget({
  type: "opnsense",
  label: "OPNsense",
  description: "Firewall gateway status — latency, packet loss, and online state",
  category: "infrastructure",
  icon: "shield-alert",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./opnsense"),
});

registerWidget({
  type: "mqtt",
  label: "MQTT Topics",
  description: "Live topic values from your MQTT broker — home automation states",
  category: "infrastructure",
  icon: "radio",
  defaultW: 4,
  defaultH: 4,
  minW: 3,
  minH: 3,
  configSchema: z.object({
    integrationId: z.string().optional(),
  }),
  component: () => import("./mqtt"),
});
