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

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tag(property: string, content: string | number): string {
  return `<meta property="${property}" content="${escapeAttribute(String(content))}" />`;
}

function text(value: string, name: string): string {
  if (!value.trim()) throw new TypeError(`${name} must not be empty`);
  return value;
}

function mediaUrl(value: string, name: string, secure = false): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${name} must be an absolute HTTP(S) URL`);
  }
  if (
    (parsed.protocol !== "https:" && (secure || parsed.protocol !== "http:")) ||
    !/^https?:\/\//i.test(value) ||
    parsed.username ||
    parsed.password ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  )
    throw new TypeError(
      `${name} must be an absolute ${secure ? "HTTPS" : "HTTP(S)"} URL without credentials or whitespace`,
    );
  // Preserve signed URLs byte for byte; escape only when serializing HTML.
  return value;
}

function dimension(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new TypeError(`${name} must be a positive integer`);
  return value;
}

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
