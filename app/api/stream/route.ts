import { NextRequest } from "next/server";
import { subscribe } from "@/lib/poller/sse-hub";
import { startPoller } from "@/lib/poller/engine";
import { getAllCache } from "@/lib/poller/cache";
import { isAuthenticated } from "@/lib/session";

// Start poller on first SSE connection
startPoller();

export async function GET(req: NextRequest) {
  const authed = await isAuthenticated();
  if (!authed) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send current cache snapshot immediately
      const cache = getAllCache();
      for (const [integrationId, entry] of cache.entries()) {
        const payload = `event: integration-update\ndata: ${JSON.stringify({ integrationId, data: entry.data })}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      // Subscribe to broadcasts
      const unsub = subscribe((payload) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          unsub();
          clearInterval(heartbeat);
        }
      });

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        unsub();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
