# og

Primitives for rendering Open Graph card images on Fetch-API edge runtimes. Each
product brings its own design — this package supplies the layout DSL and the
render plumbing, not a themed card.

It wraps a small image-rendering runtime dependency (`workers-og`) behind a
typed API: a declarative flex-box DSL for building card markup, plus helpers
for loading fonts, inlining assets as data URIs, and turning markup into a
cache-headered PNG response.

The main entry point (`@officialunofficial/og`) is pure JS with no runtime
dependencies — safe to import in a plain test environment. Render plumbing
that loads `workers-og` lives at the `@officialunofficial/og/render` subpath,
so code that only builds card markup (and its tests) never pays for it.

## Install

```sh
bun add @officialunofficial/og workers-og
```

`workers-og` is a peer dependency — you own the single copy that gets bundled
into your worker.

## Quick start

```ts
import { Text, VStack } from "@officialunofficial/og";
import { loadGoogleFonts, OG_HEIGHT, OG_WIDTH, renderOgImage } from "@officialunofficial/og/render";

export default {
  async fetch(request: Request): Promise<Response> {
    const title = new URL(request.url).searchParams.get("title") ?? "Hello";

    const html = VStack(
      { width: OG_WIDTH, height: OG_HEIGHT, padding: 60, backgroundColor: "#101014" },
      Text({ fontSize: 64, fontWeight: 700, color: "#fafafa" }, title),
    );

    const fonts = await loadGoogleFonts([{ family: "Inter", weight: 700 }]);
    return renderOgImage(html, { fonts });
  },
};
```

## Video previews

`videoMetaTags` builds metadata for an HTML page that links to a hosted video.
It is exported from the renderer-free main entry point:

```ts
import { videoMetaTags } from "@officialunofficial/og";

const metadata = videoMetaTags({
  title: "Store it. Share it.",
  url: "https://blob.uno.fun/",
  description: "File storage for agents.",
  image: {
    url: "https://blob.uno.fun/assets/share.png",
    alt: "Blob wordmark with the Lagoon symbol",
    type: "image/png",
    width: 1200,
    height: 630,
  },
  videos: [
    {
      url: "https://blob.uno.fun/assets/preview.mp4",
      type: "video/mp4",
      width: 1200,
      height: 630,
    },
  ],
});
// Insert metadata into the page's <head>, replacing equivalent existing OG tags.
```

These URLs illustrate a future video setup; the library does not create or host
those assets. Use `renderOgImage` for the poster and supply a separately encoded
video. The helper emits `og:title`, `og:type` (default `website`), `og:url`, the
poster image properties, and `og:video` with its MIME type and pixel dimensions.
Set `type: "video.other"` for a page whose primary content is a video, rather
than a website with an accompanying preview.

List alternate video formats in preference order. Each source's structured
properties follow its root tag, as required by the [Open Graph protocol](https://ogp.me/#array).
Both images and videos accept an optional `secureUrl`, which must use HTTPS.
URLs must be absolute HTTP(S) URLs without embedded credentials or whitespace;
dimensions must be positive integers. Text and attribute values are HTML-escaped,
and signed URLs retain their original spelling and query order.

The poster remains required for consumers that do not show video. Playback,
autoplay, and platform-specific player cards depend on the sharing service;
`og:video` metadata alone does not guarantee them. This helper adds no video
encoding, network requests, or renderer dependency.

## Primitives

A tiny declarative layout DSL that emits the HTML string the renderer
consumes. Every box declares `display:flex` — the renderer rejects any `<div>`
with more than one child that doesn't, so this makes that class of bug
structurally impossible.

<img src="docs/example.png" alt="An HStack laying three colored swatches out in a row, and a VStack stacking the same three swatches in a column" width="480" />

`HStack` and `VStack` are the same `Box` primitive with a different default
`flexDirection` — `HStack` lays children out left to right, `VStack` stacks
them top to bottom. The image above is rendered by **examples/worker**'s
`/diagram` route; regenerate it with `bun run dev` in that directory and
`curl -o docs/example.png http://localhost:8787/diagram`.

| Export   | What it is                                        |
| -------- | -------------------------------------------------- |
| `Box`    | A flex box with no implied direction.               |
| `VStack` | A flex column (`flex-direction: column`).           |
| `HStack` | A flex row, vertically centered by default.         |
| `Text`   | A text run that HTML-escapes its content for you.   |
| `Img`    | An image; `src` should already be a data URI.       |

Numeric style values get a `px` suffix, except for a small unitless set
(`flex`, `fontWeight`, `lineHeight`, `opacity`, `order`, `zIndex`,
`aspectRatio`) — the same convention CSS-in-JS libraries use. A caller-supplied
`display` on `Box` still wins over the enforced default.

## Helpers

From `@officialunofficial/og/render` (loads the `workers-og` renderer):

- `renderOgImage(html, options)` — renders card markup to a PNG `Response`
  with `Content-Type` and `Cache-Control` set. `options.scale` multiplies the
  pixel dimensions only; bake the same scale into your own font sizes and
  offsets.
- `loadGoogleFonts(specs)` — fetches font variants in parallel and shapes them
  for `renderOgImage`.
- `OG_WIDTH`/`OG_HEIGHT` — the standard 1200×630 card size in CSS pixels.

From `@officialunofficial/og` (pure JS, no renderer dependency):

- `svgToDataUri(svg)`/`toDataUri(mimeType, data)` — inline assets as data
  URIs. The renderer can't fetch remote images on these runtimes, so every
  image needs to already be a data URI.
- `stopColors(svg)` — extracts `stop-color` values from an SVG in document
  order, so a card can derive an accent palette straight from a logo.
- `truncate(text, max)` — caps text on a word boundary with an ellipsis.

## Example

A brand-neutral, fully working worker lives in **examples/worker/**:

```sh
bun run build
cd examples/worker
bun link @officialunofficial/og
bun install
bun run dev
```

## Development

```sh
bun install
bun run check   # lint, format, typecheck, test, build, and package-shape checks
```

Versioning and changelog entries are automated by
[release-please](https://github.com/googleapis/release-please): every merged
commit updates a standing release pull request with the next version and
changelog entry, computed from [Conventional
Commits](https://www.conventionalcommits.org/). Merging that pull request tags
and publishes a release. Nobody hand-bumps `version` or writes
**CHANGELOG.md** entries.

Publishing to npm is a separate, manually-triggered step: run the "Publish to
npm" GitHub Action after reviewing a release. Keeping it manual means a human
decides when a version actually ships, and it keeps the repo down to one
Trusted Publisher entry to configure and keep in sync.

This requires a one-time repo setup: a fine-grained personal access token
scoped to this repo (`Contents: write`, `Pull requests: write`), stored as the
`RELEASE_PLEASE_TOKEN` secret, so release-please can open its pull request —
the org blocks the default `GITHUB_TOKEN` from creating pull requests.

## License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at
your option.
