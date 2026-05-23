"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const [step, setStep] = useState<"welcome" | "pin">("welcome");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSetup() {
    if (pin.length < 4) return setError("PIN must be at least 4 digits");
    if (pin !== confirm) return setError("PINs do not match");
    if (!/^\d+$/.test(pin)) return setError("PIN must be digits only");
    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Setup failed");
    }
  }

  return (
    <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4">
      <motion.div
        className="widget-glass p-8 w-full max-w-sm flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {step === "welcome" ? (
          <>
            <div className="flex flex-col items-center gap-3 text-center">
              <LayoutDashboard size={40} style={{ color: "var(--accent)" }} />
              <h1 className="text-2xl font-bold text-accent-glow">Welcome to Nexus</h1>
              <p style={{ color: "var(--fg-muted)" }} className="text-sm leading-relaxed">
                Your homelab dashboard. Fully configured from within the app — no config files, no SSH.
              </p>
            </div>
            <button
              onClick={() => setStep("pin")}
              className="py-3 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--accent)" }}
            >
              Get started
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck size={32} style={{ color: "var(--accent)" }} />
              <h2 className="text-lg font-bold">Set your PIN</h2>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                4–8 digits. Used to access settings and edit mode.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                inputMode="numeric"
                placeholder="Choose PIN (4–8 digits)"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }}
                className="input-field w-full text-center text-xl tracking-widest"
                autoFocus
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="Confirm PIN"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value.replace(/\D/g, "").slice(0, 8)); setError(""); }}
                className="input-field w-full text-center text-xl tracking-widest"
                onKeyDown={(e) => { if (e.key === "Enter") handleSetup(); }}
              />
              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>
            <button
              onClick={handleSetup}
              disabled={loading || pin.length < 4}
              className="py-3 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {loading ? "Setting up…" : "Create dashboard"}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
