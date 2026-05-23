"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard } from "lucide-react";

const PIN_BOXES = 6;

export default function LoginPage() {
  const [pin, setPin] = useState<string[]>(Array(PIN_BOXES).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  async function submit(fullPin: string) {
    if (fullPin.length < 4) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: fullPin }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setError(body.error ?? "Incorrect PIN");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin(Array(PIN_BOXES).fill(""));
      inputRefs.current[0]?.focus();
    }
  }

  function handleInput(idx: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...pin];
    next[idx] = value.slice(-1);
    setPin(next);
    setError("");
    if (value && idx < PIN_BOXES - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all boxes are filled
    if (next.every(Boolean)) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") {
      const filled = pin.join("");
      if (filled.length >= 4) submit(filled);
    }
  }

  return (
    <div className="min-h-screen bg-animated-gradient flex items-center justify-center p-4">
      <motion.div
        className="widget-glass p-8 w-full max-w-xs flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col items-center gap-2">
          <LayoutDashboard size={32} style={{ color: "var(--accent)" }} />
          <h1 className="font-bold text-xl text-accent-glow">Nexus</h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Enter your PIN to continue</p>
        </div>

        <motion.div
          animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-3"
        >
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputRefs.current[idx] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-14 text-center text-xl font-mono rounded-xl transition-all outline-none"
              style={{
                background: "var(--bg-elevated)",
                border: `2px solid ${digit ? "var(--accent)" : "var(--border)"}`,
                color: "var(--fg)",
                caretColor: "var(--accent)",
              }}
              disabled={loading}
            />
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {loading && (
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
        )}
      </motion.div>
    </div>
  );
}
