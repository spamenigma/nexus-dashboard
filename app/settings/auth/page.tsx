"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { LogOut } from "lucide-react";

export default function AuthSettingsPage() {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const changePin = trpc.settings.changePin.useMutation({
    onSuccess: () => { setSuccess("PIN changed successfully"); setCurrentPin(""); setNewPin(""); setConfirm(""); },
    onError: (e) => setError(e.message),
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleChange() {
    setError(""); setSuccess("");
    if (newPin.length < 4) return setError("PIN must be at least 4 digits");
    if (newPin !== confirm) return setError("PINs do not match");
    changePin.mutate({ currentPin, newPin });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold">Security</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>Manage access to your dashboard.</p>
      </div>

      <div className="flex flex-col gap-4 p-4 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <p className="font-medium text-sm">Change PIN</p>
        <input type="password" inputMode="numeric" placeholder="Current PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))} className="input-field" />
        <input type="password" inputMode="numeric" placeholder="New PIN (4–8 digits)" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className="input-field" />
        <input type="password" inputMode="numeric" placeholder="Confirm new PIN" value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))} className="input-field" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
        <button onClick={handleChange} disabled={changePin.isPending} className="py-2.5 rounded-xl text-sm font-medium text-white" style={{ background: "var(--accent)" }}>
          {changePin.isPending ? "Saving…" : "Update PIN"}
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <p className="font-medium text-sm">Session</p>
        <button onClick={handleLogout} className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm hover:bg-white/5 transition-all" style={{ color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );
}
