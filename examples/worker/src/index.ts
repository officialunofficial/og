import {
  Box,
  HStack,
  loadGoogleFonts,
  OG_HEIGHT,
  OG_WIDTH,
  renderOgImage,
  Text,
  truncate,
  VStack,
} from "@officialunofficial/og";

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

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/diagram") {
      return renderDiagram();
    }

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
  },
};
