"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Puzzle, Palette, Shield, Info, HardDriveDownload, Bell } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/settings/integrations", label: "Integrations", icon: Puzzle },
  { href: "/settings/theme", label: "Theme", icon: Palette },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/auth", label: "Security", icon: Shield },
  { href: "/settings/backup", label: "Backup", icon: HardDriveDownload },
  { href: "/settings/about", label: "About", icon: Info },
];

export function SettingsNav() {
  const path = usePathname();
  return (
    <nav className="w-44 shrink-0 flex flex-col gap-1">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 hover:bg-white/5 transition-all"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all",
              active ? "font-medium" : "hover:bg-white/5"
            )}
            style={{
              background: active ? "var(--accent)20" : "transparent",
              color: active ? "var(--accent)" : "var(--fg-muted)",
              border: active ? "1px solid var(--accent)30" : "1px solid transparent",
            }}
          >
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
