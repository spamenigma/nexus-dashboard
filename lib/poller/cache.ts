// In-memory cache for integration poll results.
// Each integration has a snapshot of its last fetched data.

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  error?: string;
}

const cache = new Map<string, CacheEntry>();

export function setCache(integrationId: string, data: unknown) {
  cache.set(integrationId, { data, fetchedAt: Date.now() });
}

export function setCacheError(integrationId: string, error: string) {
  const prev = cache.get(integrationId);
  cache.set(integrationId, { data: prev?.data ?? null, fetchedAt: Date.now(), error });
}

export function getCache(integrationId: string): CacheEntry | undefined {
  return cache.get(integrationId);
}

export function getAllCache(): Map<string, CacheEntry> {
  return cache;
}
