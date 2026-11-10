/// <reference types="node" />
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

// Vitest runs in Node, which can't import a .wasm file as a module; compile the
// real binary so the renderer under test is the real Takumi engine.
vi.mock("@takumi-rs/wasm/takumi_wasm_bg.wasm", async () => {
  const path = createRequire(import.meta.url).resolve("@takumi-rs/wasm/takumi_wasm_bg.wasm");
  return { default: await WebAssembly.compile(readFileSync(path)) };
});

const { Box, VStack } = await import("./primitives.js");
const { loadGoogleFonts, OG_HEIGHT, OG_WIDTH, renderOgImage } = await import("./render.js");

const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

const card = VStack(
  { width: OG_WIDTH, height: OG_HEIGHT, backgroundColor: "#101014" },
  Box({ width: 200, height: 200, backgroundColor: "#6366f1" }),
);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OG_WIDTH / OG_HEIGHT", () => {
  it("are the standard Open Graph card dimensions", () => {
    expect(OG_WIDTH).toBe(1200);
    expect(OG_HEIGHT).toBe(630);
  });
});

function stubFontFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("https://fonts.googleapis.com/")) {
      return new Response("src: url(https://fonts.example/f.ttf) format('truetype');");
    }
    return new Response(new Uint8Array([1, 2, 3, 4]));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("loadGoogleFonts", () => {
  it("maps each spec to a loaded font with name/weight/style", async () => {
    stubFontFetch();
    const fonts = await loadGoogleFonts([
      { family: "Alpha Sans", weight: 500 },
      { family: "Alpha Sans", weight: 700 },
    ]);
    expect(fonts).toEqual([
      { name: "Alpha Sans", data: expect.any(ArrayBuffer), weight: 500, style: "normal" },
      { name: "Alpha Sans", data: expect.any(ArrayBuffer), weight: 700, style: "normal" },
    ]);
  });

  it("memoizes font binaries across calls", async () => {
    const fetchMock = stubFontFetch();
    await loadGoogleFonts([{ family: "Memo Sans", weight: 400 }]);
    const calls = fetchMock.mock.calls.length;
    await loadGoogleFonts([{ family: "Memo Sans", weight: 400 }]);
    expect(fetchMock.mock.calls.length).toBe(calls);
  });

  it("evicts a failed load so the next call retries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );
    await expect(loadGoogleFonts([{ family: "Flaky Sans", weight: 400 }])).rejects.toThrow(/500/);
    stubFontFetch();
    await expect(loadGoogleFonts([{ family: "Flaky Sans", weight: 400 }])).resolves.toHaveLength(1);
  });
});

describe("renderOgImage", () => {
  it("renders a real 1200x630 PNG with a year-long immutable cache header by default", async () => {
    const res = await renderOgImage(card, { fonts: [] });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.slice(0, 8)).toEqual(PNG_MAGIC);
    expect(pngSize(bytes)).toEqual({ width: 1200, height: 630 });
  });

  it("lets the caller override the cache-control header", async () => {
    const res = await renderOgImage(card, { fonts: [], cacheControl: "no-store" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("doubles the pixel dimensions at scale 2", async () => {
    const res = await renderOgImage(card, { fonts: [], scale: 2 });
    expect(pngSize(new Uint8Array(await res.arrayBuffer()))).toEqual({ width: 2400, height: 1260 });
  });

  it("honors custom dimensions and the webp format", async () => {
    const res = await renderOgImage(card, { fonts: [], width: 600, height: 300, format: "webp" });
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(String.fromCharCode(...Array.from(bytes.subarray(0, 4)))).toBe("RIFF");
  });

  it("fetches emoji images when the emoji option is set", async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#e0245e"/></svg>';
    const fetchMock = vi.fn(
      async () => new Response(svg, { headers: { "Content-Type": "image/svg+xml" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const html = VStack(
      { width: OG_WIDTH, height: OG_HEIGHT, fontSize: 72, backgroundColor: "#101014" },
      "🚀",
    );
    const res = await renderOgImage(html, { fonts: [], emoji: "twemoji" });
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(pngSize(new Uint8Array(await res.arrayBuffer()))).toEqual({ width: 1200, height: 630 });

    const urls = fetchMock.mock.calls.map((call) => String((call as unknown[])[0]));
    expect(urls.some((url) => url.includes("twemoji") && url.endsWith("1f680.svg"))).toBe(true);
  });
});
