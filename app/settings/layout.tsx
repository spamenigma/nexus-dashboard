import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/session";
import { SettingsNav } from "@/components/settings/SettingsNav";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-4xl mx-auto p-4 pt-8 flex gap-6">
        <SettingsNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
