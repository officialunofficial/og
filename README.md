# og

Primitives for Open Graph metadata and card images on Fetch-API edge runtimes.
You bring the design; this package brings the layout DSL and render plumbing.

```sh
bun add @officialunofficial/og workers-og
```

`workers-og` is a peer dependency, so you own the one copy bundled into your worker.

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
- `openGraphMetaTags`, `videoMetaTags`, `metaTags` — `<meta>` generation. See [docs/metadata.md](docs/metadata.md).

**`@officialunofficial/og/render`** — loads `workers-og`.

- `renderOgImage(html, options)` — markup to a cached PNG `Response`.
- `loadGoogleFonts(specs)` — fetch fonts in parallel.
- `OG_WIDTH`, `OG_HEIGHT` — 1200×630.

A working worker lives in [examples/worker](examples/worker).

## Development

```sh
bun install
bun run check   # lint, format, typecheck, test, build, package checks
```

Releases are automated with release-please from Conventional Commits; publishing to
npm is a manual GitHub Action.

## License

[MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
