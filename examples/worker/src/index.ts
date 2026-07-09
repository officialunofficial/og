import {
  Box,
  loadGoogleFonts,
  OG_HEIGHT,
  OG_WIDTH,
  renderOgImage,
  Text,
  truncate,
  VStack,
} from "@officialunofficial/og";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
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
