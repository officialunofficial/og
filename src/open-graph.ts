import { metaTags } from "./meta-tags.js";
import {
  dateTime,
  enumValue,
  locale,
  mediaUrl,
  positiveInteger,
  mimeType,
  text,
} from "./metadata-values.js";
import type {
  OgDateTime,
  OgMedia,
  OgImage,
  OgVideoMedia,
  OgMusicReference,
  OgProperty,
  OgObject,
  OgVideoDetails,
  OpenGraphMetadataOptions,
} from "./open-graph-types.js";

/** Canonical properties and URL aliases from the current ogp.me vocabulary. */
export const OG_PROPERTIES = [
  "og:title",
  "og:type",
  "og:url",
  "og:description",
  "og:determiner",
  "og:locale",
  "og:locale:alternate",
  "og:site_name",
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "og:image:type",
  "og:image:width",
  "og:image:height",
  "og:image:alt",
  "og:video",
  "og:video:url",
  "og:video:secure_url",
  "og:video:type",
  "og:video:width",
  "og:video:height",
  "og:video:alt",
  "og:audio",
  "og:audio:url",
  "og:audio:secure_url",
  "og:audio:type",
  "article:published_time",
  "article:modified_time",
  "article:expiration_time",
  "article:author",
  "article:section",
  "article:tag",
  "book:author",
  "book:isbn",
  "book:release_date",
  "book:tag",
  "profile:first_name",
  "profile:last_name",
  "profile:username",
  "profile:gender",
  "music:duration",
  "music:album",
  "music:album:disc",
  "music:album:track",
  "music:musician",
  "music:song",
  "music:song:disc",
  "music:song:track",
  "music:release_date",
  "music:creator",
  "video:actor",
  "video:actor:role",
  "video:director",
  "video:writer",
  "video:duration",
  "video:release_date",
  "video:tag",
  "video:series",
  "payment:description",
  "payment:currency",
  "payment:amount",
  "payment:expires_at",
  "payment:status",
  "payment:id",
  "payment:success_url",
] as const;
export type OgStandardProperty = (typeof OG_PROPERTIES)[number];
const standardProperties: ReadonlySet<string> = new Set(OG_PROPERTIES);

function checkKeys(value: object, keys: readonly string[]): void {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) throw new TypeError(`Unsupported object metadata field: ${key}`);
  }
}

function items<T>(value: readonly T[] | undefined, name: string): readonly T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new TypeError(`${name} must be an array`);
  return value;
}

/** Collect an object's properties without sorting, deduplicating or fetching URLs. */
class Properties {
  readonly values: OgProperty[] = [];

  string(property: string, value?: string): void {
    if (value === undefined) return;
    if (typeof value !== "string") throw new TypeError(`${property} must be text`);
    this.values.push({ property, content: value });
  }
  url(property: string, value?: string, secure = false): void {
    if (value !== undefined) this.string(property, mediaUrl(value, property, secure));
  }
  integer(property: string, value?: number): void {
    if (value !== undefined)
      this.values.push({ property, content: positiveInteger(value, property) });
  }
  date(property: string, value?: OgDateTime, requireSeconds = false): void {
    if (value !== undefined) this.string(property, dateTime(value, property, requireSeconds));
  }
  strings(property: string, values?: readonly string[], urls = false): void {
    for (const value of items(values, property)) {
      if (urls) this.url(property, value);
      else this.string(property, value);
    }
  }
  media(root: string, source: OgMedia): void {
    this.url(root, mediaUrl(source.url, root));
    this.url(`${root}:secure_url`, source.secureUrl, true);
    if (source.type !== undefined)
      this.string(`${root}:type`, mimeType(source.type, `${root}:type`));
  }
  visual(root: string, source: OgImage | OgVideoMedia): void {
    checkKeys(source, ["url", "secureUrl", "type", "width", "height", "alt"]);
    this.media(root, source);
    this.integer(`${root}:width`, source.width);
    this.integer(`${root}:height`, source.height);
    this.string(`${root}:alt`, source.alt);
  }
  tracks(root: string, references?: readonly OgMusicReference[]): void {
    for (const reference of items(references, root)) {
      checkKeys(reference, ["url", "disc", "track"]);
      this.url(root, mediaUrl(reference.url, root));
      this.integer(`${root}:disc`, reference.disc);
      this.integer(`${root}:track`, reference.track);
    }
  }
  video(details: OgVideoDetails): void {
    for (const actor of items(details.actors, "video.actors")) {
      checkKeys(actor, ["url", "role"]);
      this.url("video:actor", mediaUrl(actor.url, "video:actor"));
      this.string("video:actor:role", actor.role);
    }
    this.strings("video:director", details.directors, true);
    this.strings("video:writer", details.writers, true);
    this.integer("video:duration", details.duration);
    this.date("video:release_date", details.releaseDate);
    this.strings("video:tag", details.tags);
  }
}

function objectProperties(options: OgObject, out: Properties): void {
  const type = options.type ?? "website";
  const group = type.includes(".") ? type.split(".")[0] : type;
  // Catch mismatched verticals in JavaScript as well as in the discriminated TS types.
  for (const [key, value] of Object.entries(options)) {
    if (
      ["article", "book", "profile", "music", "video", "payment"].includes(key) &&
      value !== undefined &&
      (value === null || typeof value !== "object" || Array.isArray(value))
    ) {
      throw new TypeError(`${key} metadata must be an object`);
    }
    if (
      ["article", "book", "profile", "music", "video", "payment"].includes(key) &&
      value !== undefined &&
      key !== group
    ) {
      throw new TypeError(`${key} metadata does not belong to type ${type}`);
    }
  }
  switch (options.type) {
    case undefined:
    case "website":
      return;
    case "article": {
      const value = options.article ?? {};
      checkKeys(value, [
        "publishedTime",
        "modifiedTime",
        "expirationTime",
        "authors",
        "section",
        "tags",
      ]);
      out.date("article:published_time", value.publishedTime);
      out.date("article:modified_time", value.modifiedTime);
      out.date("article:expiration_time", value.expirationTime);
      out.strings("article:author", value.authors, true);
      out.string("article:section", value.section);
      out.strings("article:tag", value.tags);
      return;
    }
    case "book": {
      const value = options.book ?? {};
      checkKeys(value, ["authors", "isbn", "releaseDate", "tags"]);
      out.strings("book:author", value.authors, true);
      out.string("book:isbn", value.isbn);
      out.date("book:release_date", value.releaseDate);
      out.strings("book:tag", value.tags);
      return;
    }
    case "profile": {
      const value = options.profile ?? {};
      checkKeys(value, ["firstName", "lastName", "username", "gender"]);
      out.string("profile:first_name", value.firstName);
      out.string("profile:last_name", value.lastName);
      out.string("profile:username", value.username);
      if (value.gender !== undefined)
        out.string("profile:gender", enumValue(value.gender, ["male", "female"], "profile.gender"));
      return;
    }
    case "music.song": {
      const value = options.music ?? {};
      checkKeys(value, ["duration", "albums", "musicians"]);
      out.integer("music:duration", value.duration);
      out.tracks("music:album", value.albums);
      out.strings("music:musician", value.musicians, true);
      return;
    }
    case "music.album": {
      const value = options.music ?? {};
      checkKeys(value, ["songs", "musicians", "releaseDate"]);
      out.tracks("music:song", value.songs);
      out.strings("music:musician", value.musicians, true);
      out.date("music:release_date", value.releaseDate);
      return;
    }
    case "music.playlist": {
      const value = options.music ?? {};
      checkKeys(value, ["songs", "creators"]);
      out.tracks("music:song", value.songs);
      out.strings("music:creator", value.creators, true);
      return;
    }
    case "music.radio_station": {
      const value = options.music ?? {};
      checkKeys(value, ["creators"]);
      out.strings("music:creator", value.creators, true);
      return;
    }
    case "video.movie":
    case "video.tv_show":
    case "video.other":
    case "video.episode": {
      const value = options.video ?? {};
      const keys = ["actors", "directors", "writers", "duration", "releaseDate", "tags"];
      if (options.type === "video.episode") keys.push("series");
      checkKeys(value, keys);
      out.video(value);
      if (options.type === "video.episode") out.url("video:series", options.video?.series);
      return;
    }
    case "payment.link": {
      const value = options.payment ?? {};
      checkKeys(value, [
        "description",
        "currency",
        "amount",
        "expiresAt",
        "status",
        "id",
        "successUrl",
      ]);
      out.string("payment:description", value.description);
      if (value.currency !== undefined) {
        if (!/^[A-Z]{3}$/.test(value.currency))
          throw new TypeError("payment.currency must be a three-letter uppercase currency code");
        out.string("payment:currency", value.currency);
      }
      if (value.amount !== undefined) {
        if (typeof value.amount !== "number" || !Number.isFinite(value.amount))
          throw new TypeError("payment.amount must be a finite number");
        out.values.push({ property: "payment:amount", content: value.amount });
      }
      out.date("payment:expires_at", value.expiresAt, true);
      if (value.status !== undefined)
        out.string(
          "payment:status",
          enumValue(value.status, ["PENDING", "PAID", "FAILED", "EXPIRED"], "payment.status"),
        );
      out.string("payment:id", value.id);
      out.url("payment:success_url", value.successUrl);
      return;
    }
    default:
      if (!/^[A-Za-z][\w.-]*:[A-Za-z_][\w.-]*$/.test(type))
        throw new TypeError(`Unsupported Open Graph type: ${type}`);
  }
}

/** Build current Open Graph metadata; images are required even when video is present.
 * Media and structured object references are grouped in caller-supplied order.
 */
export function openGraphMetaTags(options: OpenGraphMetadataOptions): string {
  if (!Array.isArray(options.images) || !options.images.length)
    throw new TypeError("images must contain at least one poster");
  const out = new Properties();
  out.string("og:title", text(options.title, "title"));
  out.string("og:type", options.type ?? "website");
  out.url("og:url", mediaUrl(options.url, "url"));
  out.string("og:description", options.description);
  if (options.determiner !== undefined)
    out.string(
      "og:determiner",
      enumValue(options.determiner, ["a", "an", "the", "", "auto"], "determiner"),
    );
  if (options.locale !== undefined) out.string("og:locale", locale(options.locale));
  for (const value of items(options.alternateLocales, "alternateLocales"))
    out.string("og:locale:alternate", locale(value));
  out.string("og:site_name", options.siteName);
  for (const image of options.images) {
    if (typeof image.alt !== "string")
      throw new TypeError("Each image needs alt text (an empty string is permitted)");
    out.visual("og:image", image);
  }
  for (const video of items(options.videos, "videos")) out.visual("og:video", video);
  for (const audio of items(options.audio, "audio")) {
    checkKeys(audio, ["url", "secureUrl", "type"]);
    out.media("og:audio", audio);
  }
  objectProperties(options, out);
  for (const property of items(options.extensions, "extensions")) {
    if (standardProperties.has(property.property))
      throw new TypeError(`Use typed fields for ${property.property}`);
    out.values.push(property);
  }
  return metaTags(out.values);
}
