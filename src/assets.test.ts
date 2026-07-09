import { describe, expect, it } from "vitest";
import { stopColors, svgToDataUri, toDataUri } from "./assets.js";

describe("svgToDataUri", () => {
  it("trims and URI-encodes an SVG string", () => {
    const uri = svgToDataUri('  <svg><rect fill="#fff"/></svg>  ');
    expect(uri).toBe(`data:image/svg+xml,${encodeURIComponent('<svg><rect fill="#fff"/></svg>')}`);
  });
});

describe("toDataUri", () => {
  it("round-trips a small buffer", () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const uri = toDataUri("image/png", bytes.buffer);
    expect(uri).toMatch(/^data:image\/png;base64,/);
    const b64 = uri.slice(uri.indexOf(",") + 1);
    expect(atob(b64)).toBe("Hello");
  });

  it("handles an empty buffer", () => {
    const uri = toDataUri("image/png", new ArrayBuffer(0));
    expect(uri).toBe("data:image/png;base64,");
  });

  it("handles a buffer larger than the chunk size without truncation", () => {
    const size = 0x8000 * 2 + 100;
    const bytes = new Uint8Array(size).fill(65); // "A" repeated
    const uri = toDataUri("application/octet-stream", bytes.buffer);
    const b64 = uri.slice(uri.indexOf(",") + 1);
    expect(atob(b64).length).toBe(size);
    expect(atob(b64)).toBe("A".repeat(size));
  });
});

describe("stopColors", () => {
  it("extracts stop-color values in document order", () => {
    const svg = `<svg><stop stop-color="#ff00aa"/><stop stop-color="#aa00ff"/></svg>`;
    expect(stopColors(svg)).toEqual(["#ff00aa", "#aa00ff"]);
  });

  it("returns an empty array when there are no stops", () => {
    expect(stopColors("<svg></svg>")).toEqual([]);
  });

  it("ignores non-6-hex stop-color values", () => {
    const svg = `<svg><stop stop-color="#fff"/><stop stop-color="notacolor"/></svg>`;
    expect(stopColors(svg)).toEqual([]);
  });
});
