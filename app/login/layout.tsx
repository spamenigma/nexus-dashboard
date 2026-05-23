import { redirect } from "next/navigation";
import { isPinSetup } from "@/lib/auth";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const pinSetup = await isPinSetup();
  if (!pinSetup) redirect("/setup");
  return <>{children}</>;
}
