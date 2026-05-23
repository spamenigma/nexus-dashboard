"use client";
import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const { data: initialCount = 0, refetch } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { refetchInterval: 30_000 }
  );

  const count = liveCount ?? initialCount;

  useEffect(() => {
    esRef.current = new EventSource("/api/stream");
    const es = esRef.current;

    function onNew(e: MessageEvent) {
      const payload = JSON.parse(e.data) as { unreadCount: number };
      setLiveCount(payload.unreadCount);
      setPulse(true);
      setTimeout(() => setPulse(false), 2_000);
    }

    es.addEventListener("notification-new", onNew);
    return () => {
      es.removeEventListener("notification-new", onNew);
      es.close();
      esRef.current = null;
    };
  }, []);

  // Sync live count when query refreshes
  useEffect(() => {
    if (liveCount === null) return;
    setLiveCount(initialCount);
  }, [initialCount]);

  function handleMarkAllRead() {
    setLiveCount(0);
    refetch();
  }

  function handleCountChange(n: number) {
    setLiveCount(n);
    refetch();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg transition-all hover:bg-white/5"
        style={{ color: count > 0 ? "var(--accent)" : "var(--fg-muted)" }}
        title={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell
          size={16}
          style={pulse ? { filter: "drop-shadow(0 0 6px var(--accent))" } : undefined}
        />
        <AnimatePresence>
          {count > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-white font-bold"
              style={{
                background: "#ef4444",
                width: 16,
                height: 16,
                fontSize: 9,
                boxShadow: pulse ? "0 0 10px #ef4444aa" : "none",
              }}
            >
              {count > 99 ? "99+" : count}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <NotificationPanel
            onClose={() => setOpen(false)}
            onMarkAllRead={handleMarkAllRead}
            onCountChange={handleCountChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
