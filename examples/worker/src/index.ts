import { Box, cachedResponse, HStack, Text, truncate, VStack } from "@officialunofficial/og";
import { loadGoogleFonts, OG_HEIGHT, OG_WIDTH, renderOgImage } from "@officialunofficial/og/render";

const SWATCHES: Array<[string, string]> = [
  ["#6366f1", "1"],
  ["#06b6d4", "2"],
  ["#f59e0b", "3"],
];

function swatch(color: string, label: string): string {
  return Box(
    {
      width: 84,
      height: 84,
      backgroundColor: color,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    Text({ fontSize: 30, fontWeight: 700, color: "#0b0b12" }, label),
  );
}

function caption(text: string): string {
  return Text({ fontSize: 20, fontWeight: 500, color: "#9ca3af", letterSpacing: -0.2 }, text);
}

async function renderDiagram(): Promise<Response> {
  const WIDTH = 620;
  const HEIGHT = 600;
  const html = VStack(
    {
      width: WIDTH,
      height: HEIGHT,
      padding: 48,
      gap: 28,
      backgroundColor: "#0b0b12",
      fontFamily: "'DM Sans', sans-serif",
    },
    Text(
      { fontSize: 40, fontWeight: 700, color: "#f5f5f7", letterSpacing: -1 },
      "VStack and HStack",
    ),
    VStack(
      { gap: 12 },
      caption("HStack — flex row, items left to right"),
      HStack({ gap: 16 }, ...SWATCHES.map(([color, label]) => swatch(color, label))),
    ),
    VStack(
      { gap: 12 },
      caption("VStack — flex column, items top to bottom"),
      VStack({ gap: 12 }, ...SWATCHES.map(([color, label]) => swatch(color, label))),
    ),
  );

  const fonts = await loadGoogleFonts([
    { family: "DM Sans", weight: 500 },
    { family: "DM Sans", weight: 700 },
  ]);
  return renderOgImage(html, { fonts, width: WIDTH, height: HEIGHT });
}

const SIMPLE_CARD = VStack(
  { width: OG_WIDTH, height: OG_HEIGHT, padding: 60, backgroundColor: "#101014" },
  Text({ fontSize: 64, fontWeight: 700, color: "#fafafa" }, "Benchmark card"),
);

const RICH_CARD = VStack(
  {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    padding: 60,
    gap: 24,
    backgroundImage: "linear-gradient(135deg, #101014, #312e81)",
  },
  Text({ fontSize: 64, fontWeight: 700, color: "#fafafa" }, "Gradients and shadows on the edge"),
  Text(
    { fontSize: 30, color: "#a1a1aa" },
    "A longer description that wraps across several lines. ".repeat(3),
  ),
  HStack(
    { gap: 16 },
    ...[1, 2, 3, 4, 5, 6].map((i) =>
      Box({
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: `hsl(${i * 50}, 70%, 55%)`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }),
    ),
  ),
);

const FLAT_CARD = VStack(
  {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    padding: 60,
    gap: 24,
    backgroundColor: "#1b1b3a",
  },
  Text({ fontSize: 64, fontWeight: 700, color: "#fafafa" }, "Flat colors on the edge"),
  Text(
    { fontSize: 30, color: "#a1a1aa" },
    "A longer description that wraps across several lines. ".repeat(3),
  ),
  HStack(
    { gap: 16 },
    ...[1, 2, 3, 4, 5, 6].map((i) =>
      Box({
        width: 120,
        height: 120,
        borderRadius: 20,
        backgroundColor: `hsl(${i * 50}, 70%, 55%)`,
      }),
    ),
  ),
);

/**
 * Renders a fixed benchmark card with no caching: `GET /bench?card=rich|flat|simple&format=webp`.
 * Workers clocks only advance on I/O, so time the request from the client.
 */
async function renderBench(url: URL): Promise<Response> {
  const fonts = await loadGoogleFonts([
    { family: "Inter", weight: 400 },
    { family: "Inter", weight: 700 },
  ]);
  const card = url.searchParams.get("card");
  const html = card === "rich" ? RICH_CARD : card === "flat" ? FLAT_CARD : SIMPLE_CARD;
  const format = url.searchParams.get("format") === "webp" ? "webp" : "png";
  return renderOgImage(html, { fonts, format });
}

async function renderCard(url: URL): Promise<Response> {
  const title = url.searchParams.get("title") ?? "Hello from the example worker";
  const description = truncate(
    url.searchParams.get("description") ?? "A card composed from the layout primitives.",
    160,
  );

  const html = VStack(
    {
      position: "relative",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: 60,
      backgroundColor: "#101014",
      fontFamily: "'Inter', sans-serif",
    },
    Text({ fontSize: 64, fontWeight: 700, color: "#fafafa", lineHeight: 1.1 }, title),
    Text({ marginTop: 24, fontSize: 30, fontWeight: 400, color: "#a1a1aa" }, description),
    Box({
      position: "absolute",
      left: 60,
      bottom: 44,
      width: OG_WIDTH - 120,
      height: 6,
      backgroundImage: "linear-gradient(90deg, #38bdf8, #a78bfa)",
    }),
  );

  const fonts = await loadGoogleFonts([
    { family: "Inter", weight: 400 },
    { family: "Inter", weight: 700 },
  ]);
  return renderOgImage(html, { fonts });
}

export default {
  async fetch(
    request: Request,
    _env: unknown,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/bench") {
      return renderBench(url);
    }

    if (url.pathname === "/diagram") {
      return renderDiagram();
    }

    // Repeat requests skip rendering; stale cards refresh in the background.
    return cachedResponse(request, () => renderCard(url), {
      waitUntil: ctx.waitUntil.bind(ctx),
      maxAge: 3600,
      staleWhileRevalidate: 86_400,
    });
  },
};
