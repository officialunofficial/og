import { describe, expect, it, vi } from "vitest";
import { cachedResponse } from "./cache.js";

class FakeCache {
  store = new Map<string, Response>();
  async match(key: string | Request): Promise<Response | undefined> {
    return this.store.get(typeof key === "string" ? key : key.url)?.clone();
  }
  async put(key: string | Request, response: Response): Promise<void> {
    this.store.set(typeof key === "string" ? key : key.url, response);
  }
}

function setup() {
  const cache = new FakeCache();
  const pending: Promise<unknown>[] = [];
  let clock = 1_000_000;
  let renders = 0;
  const render = vi.fn(
    async () => new Response(`render-${++renders}`, { headers: { "Content-Type": "image/png" } }),
  );
  const run = (url = "https://x.test/og?title=a", extra: Record<string, unknown> = {}) =>
    cachedResponse(new Request(url), render, {
      cache: cache as unknown as Cache,
      waitUntil: (p) => void pending.push(p),
      now: () => clock,
      maxAge: 60,
      staleWhileRevalidate: 600,
      ...extra,
    });
  return {
    cache,
    render,
    run,
    flush: () => Promise.all(pending.splice(0)),
    advance: (seconds: number) => (clock += seconds * 1000),
  };
}

describe("cachedResponse", () => {
  it("renders on a miss, stores the result, then serves it as a fresh hit", async () => {
    const t = setup();
    const miss = await t.run();
    expect(miss.headers.get("X-Og-Cache")).toBe("MISS");
    expect(await miss.text()).toBe("render-1");
    await t.flush();

    const hit = await t.run();
    expect(hit.headers.get("X-Og-Cache")).toBe("HIT");
    expect(await hit.text()).toBe("render-1");
    expect(hit.headers.get("Content-Type")).toBe("image/png");
    expect(t.render).toHaveBeenCalledTimes(1);
  });

  it("serves stale instantly and revalidates in the background", async () => {
    const t = setup();
    await (await t.run()).text();
    await t.flush();
    t.advance(120); // past maxAge, inside the stale window

    const stale = await t.run();
    expect(stale.headers.get("X-Og-Cache")).toBe("STALE");
    expect(await stale.text()).toBe("render-1");
    await t.flush();
    expect(t.render).toHaveBeenCalledTimes(2);

    const next = await t.run();
    expect(next.headers.get("X-Og-Cache")).toBe("HIT");
    expect(await next.text()).toBe("render-2");
  });

  it("keeps serving the stale copy when background revalidation fails", async () => {
    const t = setup();
    await (await t.run()).text();
    await t.flush();
    t.advance(120);
    t.render.mockRejectedValueOnce(new Error("boom"));

    const stale = await t.run();
    expect(stale.headers.get("X-Og-Cache")).toBe("STALE");
    await expect(t.flush()).resolves.toBeDefined();
    expect(await (await t.run()).text()).toBe("render-1");
  });

  it("re-renders synchronously once the stale window has passed", async () => {
    const t = setup();
    await (await t.run()).text();
    await t.flush();
    t.advance(60 + 600 + 1);

    const res = await t.run();
    expect(res.headers.get("X-Og-Cache")).toBe("MISS");
    expect(await res.text()).toBe("render-2");
  });

  it("shares one render between concurrent requests for the same key", async () => {
    const t = setup();
    const [a, b, c] = await Promise.all([t.run(), t.run(), t.run()]);
    expect(t.render).toHaveBeenCalledTimes(1);
    expect(await Promise.all([a.text(), b.text(), c.text()])).toEqual([
      "render-1",
      "render-1",
      "render-1",
    ]);
  });

  it("keys on the full URL, so different queries render separately", async () => {
    const t = setup();
    await (await t.run("https://x.test/og?title=a")).text();
    await (await t.run("https://x.test/og?title=b")).text();
    expect(t.render).toHaveBeenCalledTimes(2);
  });

  it("does not store failed renders", async () => {
    const t = setup();
    t.render.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    const res = await t.run();
    expect(res.status).toBe(500);
    await t.flush();
    expect(t.cache.store.size).toBe(0);
  });

  it("bypasses the cache for non-GET requests", async () => {
    const t = setup();
    const res = await cachedResponse(
      new Request("https://x.test/og", { method: "POST" }),
      t.render,
      {
        cache: t.cache as unknown as Cache,
        waitUntil: () => {},
      },
    );
    expect(res.headers.get("X-Og-Cache")).toBe("BYPASS");
    expect(t.cache.store.size).toBe(0);
  });
});
