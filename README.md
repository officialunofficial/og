# og

Primitives for Open Graph metadata and card images on Fetch-API edge runtimes.
You bring the design; this package brings the layout DSL and render plumbing.

```sh
bun add @officialunofficial/og @takumi-rs/wasm
```

`@takumi-rs/wasm` is a peer dependency, so you own the one copy bundled into your worker.

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

## API

**`@officialunofficial/og`** — pure JS, no renderer dependency.

- `Box`, `VStack`, `HStack`, `Text`, `Img` — flex-box layout DSL. Every box is `display:flex`.
- `svgToDataUri`, `toDataUri`, `stopColors`, `truncate` — asset and text helpers. Images must be data URIs.
- `cachedResponse(request, render, options)` — Cache API wrapper with stale-while-revalidate. See below.
- `openGraphMetaTags`, `videoMetaTags`, `metaTags` — `<meta>` generation. See [docs/metadata.md](docs/metadata.md).

**`@officialunofficial/og/render`** — loads the Takumi wasm renderer.

- `renderOgImage(html, options)` — markup to a cached PNG `Response`.
- `loadGoogleFonts(specs)` — fetch fonts in parallel.
- `OG_WIDTH`, `OG_HEIGHT` — 1200×630.

A working worker lives in [examples/worker](examples/worker).

## Fonts and emoji

The renderer bundles no fonts. Load one font for each script you draw. Latin,
Japanese, Chinese and Arabic text render correctly with a matching Google Font,
including right-to-left layout. Hangul stays empty until you load a Korean font.

The renderer has no emoji font either. Without help, emoji show as empty boxes.
Set `emoji` to draw them as images from a CDN:

```ts
await renderOgImage(html, { fonts, emoji: "twemoji" });
```

Install the optional peer dependency first: `bun add @takumi-rs/helpers`. The
first render fetches the emoji images, so cache the response.

## Speed

These timings come from `bun run bench` on `workerd`. Each is the p50 request time for a
1200×630 card on a laptop.

| Card | p50 | Size |
| --- | ---: | ---: |
| Simple text card, PNG | 4.4 ms | 4 KB |
| Flat colors, six tiles and wrapped text, PNG | 5.8 ms | 16 KB |
| Same layout with gradients and shadows, PNG | 15.4 ms | 90 KB |
| Same layout with gradients and shadows, WebP | 10.3 ms | 163 KB |

Most of the render time is PNG encoding, and gradients make it much slower.

- Cache the response with `cachedResponse`. A cache hit costs no render time.
- Prefer flat colors. They render 2.7 times faster than gradients and shadows.
- Keep `scale` at 1 unless you need Retina output. `scale: 2` costs about 3 times more.
- `format: "webp"` encodes faster but the wasm build writes lossless files. They are larger
  than PNG and some crawlers do not read WebP.

## Caching

Rendering costs 5–30 ms of CPU; a cache hit costs none. `cachedResponse` serves
fresh entries directly, serves stale ones instantly while re-rendering in the
background, and renders concurrent misses once.

```ts
export default {
  fetch: (request: Request, _env: unknown, ctx: ExecutionContext) =>
    cachedResponse(request, () => renderCard(request), {
      waitUntil: ctx.waitUntil.bind(ctx),
      maxAge: 3600, // serve without revalidating for 1 hour
      staleWhileRevalidate: 86_400, // then serve stale and refresh for 1 day
    }),
};
```

The key is the full request URL, so put every input that changes the card in
the query string. Only successful `GET` responses are stored; the
`X-Og-Cache` header reports `HIT`, `STALE`, `MISS` or `BYPASS`.

## Development

```sh
bun install
bun run verify  # lint, format, typecheck, test, build, package checks
```

Releases are automated with release-please from Conventional Commits; publishing to
npm is a manual GitHub Action.

## License

[MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
