import { describe, expect, it } from "vitest";
import { truncate } from "./text.js";

describe("truncate", () => {
  it("passes short text through trimmed and untouched", () => {
    expect(truncate("  hello world  ", 160)).toBe("hello world");
  });

  it("breaks on a word boundary and appends an ellipsis when over the cap", () => {
    const long = "word ".repeat(80).trim(); // ~400 chars, well over the cap
    const result = truncate(long, 160);
    expect(result.length).toBeLessThanOrEqual(161);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toContain("wor…");
  });

  it("strips trailing punctuation before the ellipsis", () => {
    const result = truncate("one two three, four five.", 15);
    expect(result).toBe("one two three…");
  });
});
