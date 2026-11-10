// Primitives for rendering Open Graph card images on Fetch-API edge runtimes.
// Each product brings its own design.
//
// This entry point is pure JS with no runtime dependencies — it never loads
// the Takumi wasm renderer, so it's safe to import in a plain Node test
// environment. Render plumbing (which does load Takumi) lives at the
// "@officialunofficial/og/render" subpath so consumers who only need the
// layout DSL, metadata, or text/asset helpers don't pay for it.

export { Box, HStack, Img, Text, VStack } from "./primitives.js";
export type { Style, StyleValue } from "./primitives.js";
export { stopColors, svgToDataUri, toDataUri } from "./assets.js";
export { truncate } from "./text.js";
export { cachedResponse } from "./cache.js";
export type { CacheOptions, CacheStatus } from "./cache.js";
export { videoMetaTags } from "./metadata.js";
export type { OgPoster, OgVideo, VideoMetadataOptions } from "./metadata.js";
export { openGraphMetaTags, OG_PROPERTIES } from "./open-graph.js";
export { metaTags } from "./meta-tags.js";
export { OG_NAMESPACES } from "./open-graph-types.js";
export type { OgStandardProperty } from "./open-graph.js";
export type {
  OpenGraphMetadataOptions,
  OgObject,
  OgProperty,
  OgMedia,
  OgImage,
  OgVideoMedia,
  OgAudio,
  OgDateTime,
  OgDeterminer,
  OgArticle,
  OgBook,
  OgProfile,
  OgMusicReference,
  OgMusicSong,
  OgMusicAlbum,
  OgMusicPlaylist,
  OgMusicRadioStation,
  OgActor,
  OgVideoDetails,
  OgVideoEpisode,
  OgPayment,
} from "./open-graph-types.js";
