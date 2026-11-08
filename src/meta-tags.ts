import { escapeAttribute } from "./metadata-values.js";
import type { OgProperty } from "./open-graph-types.js";

export function metaTag(property: string, content: string | number | boolean): string {
  if (!/^[A-Za-z][\w.-]*(?::[A-Za-z_][\w.-]*)+$/.test(property)) {
    throw new TypeError("Metadata properties must be namespaced identifiers");
  }
  if (
    (typeof content !== "string" && typeof content !== "number" && typeof content !== "boolean") ||
    (typeof content === "number" && !Number.isFinite(content))
  )
    throw new TypeError("Metadata content must be text, a finite number, or a boolean");
  return `<meta property="${property}" content="${escapeAttribute(String(content))}" />`;
}

/** Escape and serialize properties in exactly the supplied order, including duplicates.
 * This low-level function does not validate a vocabulary's semantics or group roots.
 */
export function metaTags(properties: readonly OgProperty[]): string {
  return properties.map(({ property, content }) => metaTag(property, content)).join("\n");
}
