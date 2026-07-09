// Primitives for rendering Open Graph card images on Fetch-API edge runtimes.
// Each product brings its own design.

export { Box, HStack, Img, Text, VStack } from "./primitives.js";
export type { Style, StyleValue } from "./primitives.js";
export { stopColors, svgToDataUri, toDataUri } from "./assets.js";
export { truncate } from "./text.js";
export { loadGoogleFonts, OG_HEIGHT, OG_WIDTH, renderOgImage } from "./render.js";
export type { FontSpec, LoadedFont, RenderOptions } from "./render.js";
