/** Encodes an SVG string as a `data:image/svg+xml` URI the renderer can inline. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
}

// Chunk String.fromCharCode calls to avoid the engine's arg-count limit on
// large buffers.
const CHUNK = 0x8000;

/**
 * Base64-encodes binary data into a data URI. The renderer can't fetch remote
 * assets on edge runtimes, so raster images must be inlined.
 */
export function toDataUri(mimeType: string, data: ArrayBuffer): string {
  const bytes = new Uint8Array(data);
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Extracts every `stop-color="#rrggbb"` value from an SVG, in document order.
 * Lets a card derive its accent palette from a logo so the two never drift.
 */
export function stopColors(svg: string): string[] {
  return [...svg.matchAll(/stop-color="(#[0-9A-Fa-f]{6})"/g)]
    .map((m) => m[1])
    .filter((c): c is string => c !== undefined);
}
