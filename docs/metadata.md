# Open Graph metadata

The renderer-free `@officialunofficial/og` entry point exposes:

- `openGraphMetaTags(options)`: typed metadata for the documented Open Graph vocabulary.
- `videoMetaTags(options)`: the existing focused video API from 0.4.0, with its original required fields and validation.
- `metaTags(properties)`: an ordered, escaped serializer for custom properties, aliases, or legacy metadata.
- `OG_PROPERTIES`: the property inventory, including URL aliases.
- `OG_NAMESPACES`: standard namespace URIs for RDFa prefix declarations.

The typed builder covers the [public Open Graph specification](https://ogp.me/), reviewed on 2026-11-08. `payment.link` is included but remains **beta** in that specification. The low-level serializer is the explicit escape hatch for deprecated fields or vendor vocabularies. Neither metadata builder loads the image renderer, fetches media, or encodes videos.

## Website

```ts
import { openGraphMetaTags } from "@officialunofficial/og";

const tags = openGraphMetaTags({
  title: "Store it. Share it.",
  url: "https://blob.uno.fun/",
  description: "File storage for agents.",
  siteName: "Uno Blob",
  locale: "en_US",
  alternateLocales: ["fr_FR", "ja_JP"],
  images: [{
    url: "https://blob.uno.fun/assets/share.png",
    type: "image/png",
    width: 1200,
    height: 630,
    alt: "Blob wordmark and Lagoon symbol",
  }],
});
```

Insert `tags` in the document's `<head>`, replacing existing equivalent OG tags. `type` defaults to `website`. The title and canonical page URL are required. At least one image is required even when the page also has video or audio. Every image needs an `alt` string; it may be empty when that is intentional.

Declare RDFa prefixes on the document's `<html>` element. For a website, use `prefix="og: https://ogp.me/ns#"`. For an article, add `article: https://ogp.me/ns/article#`. `OG_NAMESPACES` supplies the standard URIs. Custom vocabularies need their own prefix declarations.

## Property inventory

All arrays retain input order and duplicate values. The first media source is preferred. Structured fields follow their root immediately, so dimensions, roles, or track positions cannot drift onto a different object.

| Options | Properties |
| --- | --- |
| `title`, `type`, `url` | `og:title`, `og:type`, `og:url` |
| `description`, `siteName`, `determiner` | `og:description`, `og:site_name`, `og:determiner` |
| `locale`, `alternateLocales[]` | `og:locale`, `og:locale:alternate` |
| `images[]` | `og:image`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt` |
| `videos[]` | `og:video`, `og:video:secure_url`, `og:video:type`, `og:video:width`, `og:video:height`, `og:video:alt` |
| `audio[]` | `og:audio`, `og:audio:secure_url`, `og:audio:type` |

Each media entry uses `url`, optional `secureUrl`, and optional MIME `type`. Visual media can include pixel `width` and `height`; video can include `alt`. Audio has no dimension fields. The typed builder uses canonical root tags; the synonymous `og:image:url`, `og:video:url`, and `og:audio:url` forms are available through `metaTags`.

### Article, book, profile

| `type` and option | Fields → emitted properties |
| --- | --- |
| `article`, `article` | `publishedTime` → `article:published_time`; `modifiedTime` → `article:modified_time`; `expirationTime` → `article:expiration_time`; `authors[]` → `article:author`; `section` → `article:section`; `tags[]` → `article:tag` |
| `book`, `book` | `authors[]` → `book:author`; `isbn` → `book:isbn`; `releaseDate` → `book:release_date`; `tags[]` → `book:tag` |
| `profile`, `profile` | `firstName` → `profile:first_name`; `lastName` → `profile:last_name`; `username` → `profile:username`; `gender` → `profile:gender` |

```ts
const article = openGraphMetaTags({
  title: "A new way to share",
  url: "https://example.com/posts/sharing",
  images: [{ url: "https://example.com/poster.png", alt: "The article illustration" }],
  type: "article",
  article: {
    publishedTime: "2026-11-08T12:30:00-05:00",
    modifiedTime: new Date("2026-11-09T10:00:00Z"),
    authors: ["https://example.com/people/ada"],
    section: "Product",
    tags: ["storage", "sharing"],
  },
});
```

Author, musician, actor, director, writer, creator, series, album, and song references are **URLs**, not display names. Names belong on the referenced profile or object page. ISBN values are emitted as strings; the library does not verify ISBN checksums.

### Music

All music types use the `music` option, with fields selected by `type`.

| `type` | Fields → emitted properties |
| --- | --- |
| `music.song` | `duration` → `music:duration`; `albums[]` → `music:album` with `music:album:disc` and `music:album:track`; `musicians[]` → `music:musician` |
| `music.album` | `songs[]` → `music:song` with `music:song:disc` and `music:song:track`; `musicians[]` → `music:musician`; `releaseDate` → `music:release_date` |
| `music.playlist` | `songs[]` → `music:song` with disc/track properties; `creators[]` → `music:creator` |
| `music.radio_station` | `creators[]` → `music:creator` |

Song and album references are `{ url, disc?, track? }`. Each source owns its own optional disc/track pair. Duration is seconds; duration, disc, and track must be positive 32-bit integers.

### Video objects and media

`videos[]` describes playable media formats on any page. The singular `video` option describes a movie, episode, show, or other video **object**. They serve different purposes and can appear together.

| `type` | Fields in `video` → emitted properties |
| --- | --- |
| `video.movie`, `video.tv_show`, `video.other` | `actors[]` → `video:actor` and `video:actor:role`; `directors[]` → `video:director`; `writers[]` → `video:writer`; `duration` → `video:duration`; `releaseDate` → `video:release_date`; `tags[]` → `video:tag` |
| `video.episode` | The same fields, plus `series` → `video:series` |

Actor references are `{ url, role? }`. Each role stays beside its actor URL. `series` is allowed only for episodes.

```ts
const episode = openGraphMetaTags({
  title: "Episode one",
  url: "https://example.com/episodes/one",
  images: [{ url: "https://example.com/poster.png", alt: "Episode one poster" }],
  videos: [
    { url: "https://example.com/episode.mp4", type: "video/mp4", width: 1280, height: 720 },
    { url: "https://example.com/episode.webm", type: "video/webm" },
  ],
  audio: [{ url: "https://example.com/audio.mp3", type: "audio/mpeg" }],
  type: "video.episode",
  video: {
    actors: [{ url: "https://example.com/people/ada", role: "Host" }],
    duration: 120,
    series: "https://example.com/series/demo",
  },
});
```

The general builder permits video URLs without MIME types or dimensions, as the protocol does. `videoMetaTags` retains the stricter 0.4.0 convenience API. Neither API guarantees autoplay or playback in a sharing application. Keep the poster fallback. X/Twitter Player Cards, oEmbed, JSON-LD, and platform review requirements are separate protocols, not automatically provided by these tags.

### Payment link (beta)

With `type: "payment.link"`, the `payment` option supports every currently documented beta field:

| Field | Property |
| --- | --- |
| `description` | `payment:description` |
| `currency` | `payment:currency` |
| `amount` | `payment:amount` |
| `expiresAt` | `payment:expires_at` |
| `status` | `payment:status` |
| `id` | `payment:id` |
| `successUrl` | `payment:success_url` |

Currency must have the uppercase three-letter format; no currency registry lookup is performed. Amount must be finite; it is not rounded or converted to minor units. Status is `PENDING`, `PAID`, `FAILED`, or `EXPIRED`. Expiration must include a time with seconds. These are descriptive tags: the library never creates a payment, verifies its status, or redirects a user.

## Validation and serialization

- URLs must be absolute HTTP(S), with no embedded credentials or raw whitespace/control characters. `secureUrl` must use HTTPS. The original URL spelling and query order are preserved, including signed query strings. URL validation does not fetch resources or verify their content type.
- Core title and object type must be nonempty. Optional string fields preserve empty strings. Determiner is `a`, `an`, `the`, `auto`, or the empty string.
- Locales use a two- or three-letter lowercase language and a two-letter uppercase territory, such as `en_US` or `eng_US`. The helper checks format, not a registry of supported languages.
- Dimensions, durations, disc, and track values must be integers from 1 through 2147483647. The existing `videoMetaTags` API retains its original safe-integer dimension checks.
- MIME types use `type/subtype` with optional token or quoted parameters, including codec lists. Syntax is checked; media contents are not inspected.
- Dates accept valid `Date` objects or extended calendar strings: `YYYY-MM-DD`, optionally followed by `THH:mm`, seconds, fractional seconds, and `Z` or an offset. Numeric offsets accept `±HH:mm` or `±HHmm`. Invalid calendar days are rejected. Strings retain their spelling; `Date` values serialize to UTC ISO strings. This is a calendar subset of ISO 8601, not support for week dates, ordinal dates, leap seconds, or `24:00`.
- Discriminated TypeScript options pair vertical fields with their object type. Runtime checks reject mismatched verticals and unknown fields inside typed object details.
- HTML attribute values are escaped. Booleans and zero are preserved in low-level/custom tags. Non-finite numbers are rejected.

## Custom and legacy properties

```ts
import { metaTags, openGraphMetaTags } from "@officialunofficial/og";

const custom = openGraphMetaTags({
  title: "A document",
  url: "https://example.com/document",
  images: [{ url: "https://example.com/poster.png", alt: "Document preview" }],
  type: "app:document",
  extensions: [
    { property: "app:ready", content: true },
    { property: "app:revision", content: 0 },
    { property: "app:tag", content: "first" },
    { property: "app:tag", content: "second" },
  ],
});

// For explicit aliases or legacy metadata, caller owns ordering and semantics.
const aliases = metaTags([
  { property: "og:image:url", content: "https://example.com/poster.png" },
  { property: "og:image:width", content: 1200 },
]);
```

Declare the custom prefix on the document, for example `prefix="og: https://ogp.me/ns# app: https://example.com/ns#"`. Custom types use a namespaced identifier such as `app:document`.

`extensions` cannot override any property in `OG_PROPERTIES`; use typed options for those fields. Vendor fields and deprecated OG fields can be serialized explicitly. They are not presented as current standard vocabulary. The low-level `metaTags` function accepts namespaced property identifiers and string/number/boolean content, escaping values and preserving the supplied order exactly. It deliberately does not validate URLs, MIME types, object schemas, root grouping, or namespace declarations. Use it only when those semantics are handled by the caller.
