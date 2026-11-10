/** Options for {@link cachedResponse}. */
export type CacheOptions = {
  /** Schedules background work past the response, e.g. `ctx.waitUntil.bind(ctx)`. */
  waitUntil: (promise: Promise<unknown>) => void;
  /** Seconds a stored response is served without revalidation. Defaults to 1 hour. */
  maxAge?: number;
  /**
   * Seconds past `maxAge` during which the stale response is still served
   * instantly while a fresh one renders in the background. Defaults to 1 day.
   * A render that fails during revalidation keeps serving the stale copy.
   */
  staleWhileRevalidate?: number;
  /** The cache to use. Defaults to the Workers `caches.default`. */
  cache?: Cache;
  /** Cache key. Defaults to the request URL, query string included. */
  key?: string | Request;
  /** Clock in milliseconds, injectable for tests. Defaults to `Date.now`. */
  now?: () => number;
};

/** Reports how a response was served; also sent as the `X-Og-Cache` header. */
export type CacheStatus = "HIT" | "STALE" | "MISS" | "BYPASS";

const STORED_AT = "X-Og-Stored-At";
const STATUS = "X-Og-Cache";

// Renders in flight in this isolate, so a burst of identical cache misses (or a
// stale entry hit by many requests) renders once instead of once per request.
const inflight = new Map<string, Promise<Response>>();

function withStatus(response: Response, status: CacheStatus): Response {
  const out = new Response(response.body, response);
  out.headers.set(STATUS, status);
  return out;
}

/**
 * Serves `render()` through the Cache API with stale-while-revalidate.
 *
 * - Fresh entry (age < `maxAge`): returned straight from the cache, no render.
 * - Stale entry (age < `maxAge + staleWhileRevalidate`): returned immediately;
 *   a fresh render replaces it in the background. Nobody waits on the render.
 * - Miss or expired: rendered once per isolate (concurrent requests share the
 *   render), returned, and stored in the background.
 *
 * Only successful `GET` requests are cached; anything else bypasses the cache.
 * The returned `X-Og-Cache` header reports `HIT`, `STALE`, `MISS` or `BYPASS`.
 */
export async function cachedResponse(
  request: Request,
  render: () => Promise<Response>,
  options: CacheOptions,
): Promise<Response> {
  if (request.method !== "GET") return withStatus(await render(), "BYPASS");

  const cache = options.cache ?? (caches as unknown as { default: Cache }).default;
  const now = options.now ?? Date.now;
  const maxAgeMs = (options.maxAge ?? 3600) * 1000;
  const swrMs = (options.staleWhileRevalidate ?? 86_400) * 1000;
  const key = options.key ?? request.url;
  const flightKey = typeof key === "string" ? key : key.url;

  // Renders once per key per isolate and stores the result for later requests.
  const refresh = (): Promise<Response> => {
    let flight = inflight.get(flightKey);
    if (!flight) {
      flight = render().then(async (fresh) => {
        if (fresh.ok) {
          const stored = new Response(fresh.clone().body, fresh);
          stored.headers.set(STORED_AT, String(now()));
          // Keep the entry for the whole serve window; Cache API evicts on its own max-age.
          stored.headers.set(
            "Cache-Control",
            `public, max-age=${Math.ceil((maxAgeMs + swrMs) / 1000)}`,
          );
          options.waitUntil(cache.put(key, stored).catch(() => {}));
        }
        return fresh;
      });
      inflight.set(flightKey, flight);
      const clear = () => inflight.delete(flightKey);
      flight.then(clear, clear);
    }
    return flight;
  };

  const hit = await cache.match(key);
  if (hit) {
    const age = now() - Number(hit.headers.get(STORED_AT) ?? 0);
    if (age < maxAgeMs) return withStatus(hit, "HIT");
    if (age < maxAgeMs + swrMs) {
      options.waitUntil(refresh().catch(() => {}));
      return withStatus(hit, "STALE");
    }
  }

  const fresh = await refresh();
  // A shared in-flight render yields one Response; give each caller its own body.
  return withStatus(fresh.clone(), "MISS");
}
