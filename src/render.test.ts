import { beforeEach, describe, expect, it, vi } from "vitest";

const loadGoogleFont = vi.fn();
const constructorCalls: Array<[string, Record<string, unknown>]> = [];

class FakeImageResponse {
  constructor(html: string, options: Record<string, unknown>) {
    constructorCalls.push([html, options]);
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new Uint8Array([1, 2, 3]).buffer;
  }
}

vi.mock("workers-og", () => ({
  loadGoogleFont,
  ImageResponse: FakeImageResponse,
}));

const { loadGoogleFonts, OG_HEIGHT, OG_WIDTH, renderOgImage } = await import("./render.js");

beforeEach(() => {
  loadGoogleFont.mockReset();
  constructorCalls.length = 0;
});

describe("OG_WIDTH / OG_HEIGHT", () => {
  it("are the standard Open Graph card dimensions", () => {
    expect(OG_WIDTH).toBe(1200);
    expect(OG_HEIGHT).toBe(630);
  });
});

describe("loadGoogleFonts", () => {
  it("maps each spec to a loaded font with name/weight/style", async () => {
    loadGoogleFont.mockResolvedValue(new ArrayBuffer(4));
    const fonts = await loadGoogleFonts([
      { family: "DM Sans", weight: 500 },
      { family: "DM Sans", weight: 700 },
    ]);
    expect(fonts).toEqual([
      { name: "DM Sans", data: expect.any(ArrayBuffer), weight: 500, style: "normal" },
      { name: "DM Sans", data: expect.any(ArrayBuffer), weight: 700, style: "normal" },
    ]);
    expect(loadGoogleFont).toHaveBeenCalledWith({ family: "DM Sans", weight: 500 });
    expect(loadGoogleFont).toHaveBeenCalledWith({ family: "DM Sans", weight: 700 });
  });
});

describe("renderOgImage", () => {
  const font = { name: "DM Sans", data: new ArrayBuffer(4), weight: 500, style: "normal" as const };

  it("returns a PNG response with a year-long immutable cache header by default", async () => {
    const res = await renderOgImage("<div></div>", { fonts: [font] });
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("lets the caller override the cache-control header", async () => {
    const res = await renderOgImage("<div></div>", { fonts: [font], cacheControl: "no-store" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("multiplies width and height by scale before passing them to the renderer", async () => {
    await renderOgImage("<div></div>", { fonts: [font], scale: 2 });
    expect(constructorCalls).toHaveLength(1);
    const [html, options] = constructorCalls[0]!;
    expect(html).toBe("<div></div>");
    expect(options).toMatchObject({ width: 2400, height: 1260, fonts: [font] });
  });

  it("defaults to the standard 1200x630 dimensions at scale 1", async () => {
    await renderOgImage("<div></div>", { fonts: [font] });
    expect(constructorCalls).toHaveLength(1);
    const [, options] = constructorCalls[0]!;
    expect(options).toMatchObject({ width: 1200, height: 630 });
  });
});
