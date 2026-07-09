import { ImageResponse, loadGoogleFont } from "workers-og";

/** The standard Open Graph card size in CSS pixels. */
export const OG_WIDTH = 1200;
/** The standard Open Graph card size in CSS pixels. */
export const OG_HEIGHT = 630;

/** A web font family + weight to load for rendering. */
export type FontSpec = { family: string; weight: number };

/** A loaded font ready to hand to the renderer. */
export type LoadedFont = { name: string; data: ArrayBuffer; weight: number; style: "normal" };

/** Fetches the given font variants in parallel. */
export async function loadGoogleFonts(specs: readonly FontSpec[]): Promise<LoadedFont[]> {
  return Promise.all(
    specs.map(async ({ family, weight }) => ({
      name: family,
      data: await loadGoogleFont({ family, weight }),
      weight,
      style: "normal" as const,
    })),
  );
}

/** Options for {@link renderOgImage}. */
export type RenderOptions = {
  fonts: LoadedFont[];
  /** Card size in CSS pixels before scaling. Defaults to 1200x630. */
  width?: number;
  height?: number;
  /** Supersampling factor for Retina-quality output. Defaults to 1. */
  scale?: number;
  /** `Cache-Control` header on the response. Defaults to a year, immutable. */
  cacheControl?: string;
};

/**
 * Renders card markup (built from the layout primitives) to a PNG `Response`
 * with image and cache headers set.
 *
 * `scale` multiplies the pixel dimensions only — bake the same scale into
 * your own font sizes and offsets, exactly as the layout primitives expect.
 */
export async function renderOgImage(html: string, options: RenderOptions): Promise<Response> {
  const scale = options.scale ?? 1;
  const response = new ImageResponse(html, {
    width: (options.width ?? OG_WIDTH) * scale,
    height: (options.height ?? OG_HEIGHT) * scale,
    fonts: options.fonts,
  });

  const body = await response.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": options.cacheControl ?? "public, max-age=31536000, immutable",
    },
  });
}
