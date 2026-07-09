// Primitives for rendering Open Graph card images on Fetch-API edge runtimes.
// Each product brings its own design.
//
// This entry point is pure JS with no runtime dependencies — it never loads
// the `workers-og` wasm renderer, so it's safe to import in a plain Node test
// environment. Render plumbing (which does load `workers-og`) lives at the
// "@officialunofficial/og/render" subpath so consumers who only need the
// layout DSL or text/asset helpers don't pay for it.

export { Box, HStack, Img, Text, VStack } from "./primitives.js";
export type { Style, StyleValue } from "./primitives.js";
export { stopColors, svgToDataUri, toDataUri } from "./assets.js";
export { truncate } from "./text.js";
