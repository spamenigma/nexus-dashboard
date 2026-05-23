// SSE connection hub — tracks active client streams and broadcasts to them.

type Subscriber = (data: string) => void;

const subscribers = new Set<Subscriber>();

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function broadcast(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const sub of subscribers) {
    try { sub(payload); } catch { /* client disconnected */ }
  }
}

export function subscriberCount() {
  return subscribers.size;
}
