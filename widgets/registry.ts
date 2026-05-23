import type { ComponentType } from "react";
import { z } from "zod";

export interface WidgetMeta {
  type: string;
  label: string;
  description: string;
  category: "core" | "monitoring" | "media" | "infrastructure" | "comms";
  icon: string;
  defaultW: number;
  defaultH: number;
  minW?: number;
  minH?: number;
  configSchema: z.ZodTypeAny;
  // Lazy-loaded component
  component: () => Promise<{ default: ComponentType<WidgetProps> }>;
}

export interface WidgetProps {
  id: string;
  config: Record<string, unknown>;
  editMode: boolean;
}

const registry = new Map<string, WidgetMeta>();

export function registerWidget(meta: WidgetMeta) {
  registry.set(meta.type, meta);
}

export function getWidget(type: string): WidgetMeta | undefined {
  return registry.get(type);
}

export function getAllWidgets(): WidgetMeta[] {
  return Array.from(registry.values()).sort((a, b) =>
    a.category.localeCompare(b.category) || a.label.localeCompare(b.label)
  );
}

export function getWidgetsByCategory() {
  const all = getAllWidgets();
  const map = new Map<string, WidgetMeta[]>();
  for (const w of all) {
    if (!map.has(w.category)) map.set(w.category, []);
    map.get(w.category)!.push(w);
  }
  return map;
}
