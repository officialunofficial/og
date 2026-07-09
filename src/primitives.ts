// Tiny declarative layout primitives for building Open Graph cards.
//
// A small set of typed, composable primitives instead of hand-written HTML
// strings. They emit the same HTML that the renderer already consumes — no
// renderer change.
//
// The one rule they enforce: every box declares `display:flex`. The renderer
// rejects any <div> with more than one child that doesn't (that's the exact
// error the raw-string version tripped on), so baking it in makes that class
// of bug structurally impossible.

export type StyleValue = string | number;
export type Style = Record<string, StyleValue>;

// CSS properties whose numeric values are unitless — everything else gets `px`
// appended (React/CSS-in-JS convention), so `fontSize: 64` → `font-size:64px`
// but `lineHeight: 1.1` and `flex: 1` stay bare.
const UNITLESS = new Set([
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "lineHeight",
  "opacity",
  "order",
  "zIndex",
  "aspectRatio",
]);

function kebab(prop: string): string {
  return prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

function serialize(style: Style): string {
  return Object.entries(style)
    .map(([prop, value]) => {
      const out = typeof value === "number" && !UNITLESS.has(prop) ? `${value}px` : value;
      return `${kebab(prop)}:${out}`;
    })
    .join(";");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// `display:flex` is prefixed so a caller-supplied `display` (e.g. "none") still
// wins via inline-style last-declaration-wins.
function box(style: Style, children: string[]): string {
  return `<div style="display:flex;${serialize(style)}">${children.join("")}</div>`;
}

/** A flex box with no implied direction — the base primitive. */
export const Box = (style: Style, ...children: string[]): string => box(style, children);

/** Vertical stack (flex column). */
export const VStack = (style: Style, ...children: string[]): string =>
  box({ flexDirection: "column", ...style }, children);

/** Horizontal stack (flex row, vertically centered by default). */
export const HStack = (style: Style, ...children: string[]): string =>
  box({ flexDirection: "row", alignItems: "center", ...style }, children);

/** A text run. The content is HTML-escaped for you. */
export const Text = (style: Style, text: string): string => box(style, [escapeHtml(text)]);

/** An image. `src` should already be a data URI (the renderer can't fetch remote images on edge runtimes). */
export const Img = (src: string, width: number, height: number, style: Style = {}): string => {
  const attrs = serialize(style);
  return `<img src="${src}" width="${width}" height="${height}"${attrs ? ` style="${attrs}"` : ""} />`;
};
