// Tracks per-integration state to detect transitions (ok→error, error→ok, item up/down).
// Only fires on state *changes* — not on repeated failures — to avoid notification spam.

type BasicState = "unknown" | "ok" | "error";

interface IntegrationState {
  basic: BasicState;
  downItems: Set<string> | null; // null = type doesn't support item-level tracking
}

const states = new Map<string, IntegrationState>();

export type ChangeEvent =
  | { kind: "integration-down" }
  | { kind: "integration-recovery" }
  | { kind: "item-down"; itemName: string }
  | { kind: "item-recovery"; itemName: string };

export function onPollError(integrationId: string): ChangeEvent[] {
  const prev = states.get(integrationId);
  if (!prev) {
    // First ever poll: record error state silently (avoid startup spam)
    states.set(integrationId, { basic: "error", downItems: null });
    return [];
  }
  if (prev.basic !== "error") {
    states.set(integrationId, { basic: "error", downItems: prev.downItems });
    return [{ kind: "integration-down" }];
  }
  return [];
}

export function onPollSuccess(integrationId: string, type: string, data: unknown): ChangeEvent[] {
  const prev = states.get(integrationId);
  const events: ChangeEvent[] = [];

  if (prev?.basic === "error") {
    events.push({ kind: "integration-recovery" });
  }

  const currentDown = extractDownItems(type, data);
  const prevDown = prev?.downItems ?? null;

  // Only emit item-level events once we have a baseline (not on first successful poll)
  if (currentDown !== null && prevDown !== null) {
    for (const item of currentDown) {
      if (!prevDown.has(item)) events.push({ kind: "item-down", itemName: item });
    }
    for (const item of prevDown) {
      if (!currentDown.has(item)) events.push({ kind: "item-recovery", itemName: item });
    }
  }

  states.set(integrationId, { basic: "ok", downItems: currentDown });
  return events;
}

function extractDownItems(type: string, data: unknown): Set<string> | null {
  if (!data || typeof data !== "object") return null;

  switch (type) {
    case "uptime-kuma": {
      if (!Array.isArray(data)) return null;
      return new Set(
        (data as Array<{ name: string; status: string }>)
          .filter((m) => m.status === "down")
          .map((m) => m.name)
      );
    }
    case "portainer": {
      if (!Array.isArray(data)) return null;
      return new Set(
        (data as Array<{ name: string; status: string }>)
          .filter((c) => c.status === "stopped")
          .map((c) => c.name)
      );
    }
    case "opnsense": {
      const d = data as { gateways?: Array<{ name: string; status: string }> };
      if (!Array.isArray(d.gateways)) return null;
      return new Set(
        d.gateways
          .filter((g) => g.status === "offline" || g.status === "loss")
          .map((g) => g.name)
      );
    }
    default:
      return null;
  }
}
