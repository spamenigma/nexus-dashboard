import { redirect } from "next/navigation";
import { isPinSetup } from "@/lib/auth";
import { isAuthenticated } from "@/lib/session";
import { DashboardClient } from "./dashboard-client";
import { db } from "@/lib/db";

export default async function HomePage() {
  const pinSetup = await isPinSetup();
  if (!pinSetup) redirect("/setup");

  const authed = await isAuthenticated();
  if (!authed) redirect("/login");

  let pages = await db.page.findMany({ orderBy: { order: "asc" } });

  if (pages.length === 0) {
    const defaultPage = await db.page.create({
      data: { name: "Overview", slug: "overview", order: 0 },
    });
    pages = [defaultPage];
  }

  const theme = await db.setting.findUnique({ where: { key: "theme" } });
  const themeData = theme ? JSON.parse(theme.value) : {};

  return <DashboardClient initialPages={pages} theme={themeData} />;
}
