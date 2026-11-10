import init, { Renderer } from "@takumi-rs/wasm";
import wasmModule from "@takumi-rs/wasm/takumi_wasm_bg.wasm";

/** The standard Open Graph card size in CSS pixels. */
export const OG_WIDTH = 1200;
/** The standard Open Graph card size in CSS pixels. */
export const OG_HEIGHT = 630;

/** A web font family and weight to load for rendering. */
export type FontSpec = { family: string; weight: number };

/** A loaded font ready to hand to the renderer. */
export type LoadedFont = { name: string; data: ArrayBuffer; weight: number; style: "normal" };

// A pre-woff2 user agent makes Google Fonts answer with plain TTF files.
const FONT_CSS_USER_AGENT =
  "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1";

// Font binaries never change for a given family and weight, so keep them for the
// life of the isolate. A rejected load is evicted so the next request retries.
const fontCache = new Map<string, Promise<ArrayBuffer>>();

async function fetchGoogleFont({ family, weight }: FontSpec): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await fetch(cssUrl, { headers: { "User-Agent": FONT_CSS_USER_AGENT } });
  if (!css.ok)
    throw new Error(`Google Fonts CSS request failed (${css.status}) for ${family} ${weight}`);
  const match = /src: url\((.+?)\) format\('(?:opentype|truetype)'\)/.exec(await css.text());
  if (!match?.[1]) throw new Error(`No TrueType source found for ${family} ${weight}`);
  const file = await fetch(match[1]);
  if (!file.ok) throw new Error(`Font download failed (${file.status}) for ${family} ${weight}`);
  return file.arrayBuffer();
}

/**
 * Fetches the given font variants in parallel, resolving to their loaded font data.
 * Results are memoized per family and weight for the life of the isolate.
 */
export async function loadGoogleFonts(specs: readonly FontSpec[]): Promise<LoadedFont[]> {
  return Promise.all(
    specs.map(async (spec) => {
      const key = `${spec.family}:${spec.weight}`;
      let data = fontCache.get(key);
      if (!data) {
        data = fetchGoogleFont(spec);
        fontCache.set(key, data);
        data.catch(() => fontCache.delete(key));
      }
      return { name: spec.family, data: await data, weight: spec.weight, style: "normal" as const };
    }),
  );
}

/** Image encodings the renderer can produce. */
export type OgImageFormat = "png" | "jpeg" | "webp";

const CONTENT_TYPES: Record<OgImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Options for {@link renderOgImage}. */
export type RenderOptions = {
  fonts: LoadedFont[];
  /** Card size in CSS pixels before scaling. Defaults to 1200x630. */
  width?: number;
  height?: number;
  /** Device pixel ratio for Retina-quality output. Defaults to 1. */
  scale?: number;
  /** Output encoding. Defaults to `"png"`. */
  format?: OgImageFormat;
  /** `Cache-Control` header on the response. Defaults to a year, immutable. */
  cacheControl?: string;
};

// The wasm binary is instantiated once per isolate and shared by every render.
let renderer: Promise<Renderer> | undefined;
const registeredFonts = new WeakSet<ArrayBuffer>();

function getRenderer(): Promise<Renderer> {
  if (renderer) return renderer;
  const ready = init({ module_or_path: wasmModule }).then(() => new Renderer());
  // A failed init is dropped so the next render retries it.
  ready.catch(() => {
    if (renderer === ready) renderer = undefined;
  });
  renderer = ready;
  return ready;
}

/**
 * Renders card markup (built from the layout primitives) to an image `Response`
 * with image and cache headers set.
 *
 * `scale` sets the device pixel ratio, so layout and font sizes stay in CSS
 * pixels while the output has `scale` times as many pixels.
 */
export async function renderOgImage(html: string, options: RenderOptions): Promise<Response> {
  const engine = await getRenderer();
  await Promise.all(
    options.fonts
      .filter((font) => !registeredFonts.has(font.data))
      .map(async (font) => {
        await engine.registerFont({
          name: font.name,
          data: font.data,
          weight: font.weight,
          style: font.style,
        });
        registeredFonts.add(font.data);
      }),
  );

  const format = options.format ?? "png";
  const scale = options.scale ?? 1;
  const body = await engine.render(html, {
    width: (options.width ?? OG_WIDTH) * scale,
    height: (options.height ?? OG_HEIGHT) * scale,
    devicePixelRatio: scale,
    format,
  });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Cache-Control": options.cacheControl ?? "public, max-age=31536000, immutable",
    },
  });
}
