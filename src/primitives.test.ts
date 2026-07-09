import { describe, expect, it } from "vitest";
import { Box, HStack, Img, Text, VStack } from "./primitives.js";

describe("Box", () => {
  it("always declares display:flex first", () => {
    expect(Box({ padding: 4 })).toBe('<div style="display:flex;padding:4px"></div>');
  });

  it("lets a caller-supplied display win via last-declaration-wins", () => {
    const html = Box({ display: "none" });
    expect(html).toBe('<div style="display:flex;display:none"></div>');
  });

  it("suffixes numeric values with px except for unitless properties", () => {
    const html = Box({ fontSize: 64, lineHeight: 1.1, flex: 1 });
    expect(html).toContain("font-size:64px");
    expect(html).toContain("line-height:1.1");
    expect(html).toContain("flex:1");
  });

  it("converts camelCase properties to kebab-case", () => {
    expect(Box({ backgroundColor: "#fff" })).toContain("background-color:#fff");
  });

  it("joins children in order", () => {
    const html = Box({}, "<span>a</span>", "<span>b</span>");
    expect(html).toBe('<div style="display:flex;"><span>a</span><span>b</span></div>');
  });
});

describe("VStack", () => {
  it("sets flex-direction:column by default", () => {
    expect(VStack({})).toContain("flex-direction:column");
  });

  it("lets the caller override flex-direction via object-spread merge", () => {
    const html = VStack({ flexDirection: "row" });
    expect(html).toContain("flex-direction:row");
    expect(html).not.toContain("column");
  });
});

describe("HStack", () => {
  it("sets flex-direction:row and align-items:center by default", () => {
    const html = HStack({});
    expect(html).toContain("flex-direction:row");
    expect(html).toContain("align-items:center");
  });

  it("lets the caller override both via object-spread merge", () => {
    const html = HStack({ flexDirection: "column", alignItems: "flex-start" });
    expect(html).toContain("flex-direction:column");
    expect(html).toContain("align-items:flex-start");
    expect(html).not.toContain("flex-direction:row");
    expect(html).not.toContain("align-items:center");
  });
});

describe("Text", () => {
  it("HTML-escapes the text content", () => {
    const html = Text({}, `<script> & "quoted"`);
    expect(html).toContain("&lt;script&gt; &amp; &quot;quoted&quot;");
    expect(html).not.toContain("<script>");
  });

  it("wraps the escaped text in a flex box", () => {
    expect(Text({ color: "red" }, "hi")).toBe('<div style="display:flex;color:red">hi</div>');
  });
});

describe("Img", () => {
  it("renders src, width, and height attributes", () => {
    const html = Img("data:image/png;base64,AA==", 52, 42);
    expect(html).toBe('<img src="data:image/png;base64,AA==" width="52" height="42" />');
  });

  it("omits the style attribute entirely when no style is given", () => {
    expect(Img("x", 1, 1)).not.toContain("style=");
  });

  it("includes a style attribute when a style is given", () => {
    const html = Img("x", 1, 1, { opacity: 0.5 });
    expect(html).toContain('style="opacity:0.5"');
  });
});

describe("nesting", () => {
  it("composes primitives into a single HTML string", () => {
    const html = VStack({ gap: 4 }, HStack({}, Text({}, "a"), Img("x", 1, 1)));
    expect(html).toBe(
      '<div style="display:flex;flex-direction:column;gap:4px">' +
        '<div style="display:flex;flex-direction:row;align-items:center">' +
        '<div style="display:flex;">a</div>' +
        '<img src="x" width="1" height="1" />' +
        "</div></div>",
    );
  });
});
