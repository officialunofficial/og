import { metaTag as tag } from "./meta-tags.js";
import { text, mediaUrl, dimension } from "./metadata-values.js";

/** A poster image retained for consumers that do not display video previews. */
export type OgPoster = {
  url: string;
  alt: string;
  type?: string;
  width?: number;
  height?: number;
  secureUrl?: string;
};

/** One hosted video format. Sources are emitted in preference order. */
export type OgVideo = {
  url: string;
  type: string;
  width: number;
  height: number;
  secureUrl?: string;
};

export type VideoMetadataOptions = {
  title: string;
  url: string;
  image: OgPoster;
  videos: readonly OgVideo[];
  /** Defaults to website; a video page can use video.other, video.movie, etc. */
  type?: string;
  description?: string;
};

/**
 * Emit Open Graph video metadata for an HTML head, with a required poster fallback.
 * Assets must already be hosted; this helper neither fetches nor encodes media.
 * Structured tags stay next to their root so alternate video formats stay grouped.
 */
export function videoMetaTags(options: VideoMetadataOptions): string {
  if (!options.videos.length) throw new TypeError("videos must contain at least one source");
  const { image } = options;
  const tags = [
    tag("og:title", text(options.title, "title")),
    tag("og:type", text(options.type ?? "website", "type")),
    tag("og:url", mediaUrl(options.url, "url")),
  ];
  if (options.description !== undefined) tags.push(tag("og:description", options.description));
  tags.push(tag("og:image", mediaUrl(image.url, "image.url")));
  if (image.secureUrl !== undefined)
    tags.push(tag("og:image:secure_url", mediaUrl(image.secureUrl, "image.secureUrl", true)));
  if (image.type !== undefined) tags.push(tag("og:image:type", text(image.type, "image.type")));
  if (image.width !== undefined)
    tags.push(tag("og:image:width", dimension(image.width, "image.width")));
  if (image.height !== undefined)
    tags.push(tag("og:image:height", dimension(image.height, "image.height")));
  tags.push(tag("og:image:alt", text(image.alt, "image.alt")));
  for (const video of options.videos) {
    tags.push(tag("og:video", mediaUrl(video.url, "video.url")));
    if (video.secureUrl !== undefined)
      tags.push(tag("og:video:secure_url", mediaUrl(video.secureUrl, "video.secureUrl", true)));
    tags.push(
      tag("og:video:type", text(video.type, "video.type")),
      tag("og:video:width", dimension(video.width, "video.width")),
      tag("og:video:height", dimension(video.height, "video.height")),
    );
  }
  return tags.join("\n");
}
