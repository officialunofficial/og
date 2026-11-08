export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function text(value: string, name: string): string {
  if (!value.trim()) throw new TypeError(`${name} must not be empty`);
  return value;
}

export function mediaUrl(value: string, name: string, secure = false): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError(`${name} must be an absolute HTTP(S) URL`);
  }
  if (
    (parsed.protocol !== "https:" && (secure || parsed.protocol !== "http:")) ||
    !/^https?:\/\//i.test(value) ||
    parsed.username ||
    parsed.password ||
    Array.from(value).some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)
  )
    throw new TypeError(
      `${name} must be an absolute ${secure ? "HTTPS" : "HTTP(S)"} URL without credentials or whitespace`,
    );
  // Preserve signed URLs byte for byte; escape only when serializing HTML.
  return value;
}

export function dimension(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new TypeError(`${name} must be a positive integer`);
  return value;
}

/** Open Graph integer values are signed 32-bit; these properties require >= 1. */
export function positiveInteger(value: number, name: string): number {
  if (!Number.isInteger(value) || value < 1 || value > 2147483647) {
    throw new TypeError(`${name} must be a positive 32-bit integer`);
  }
  return value;
}

export function enumValue(value: string, choices: readonly string[], name: string): string {
  if (!choices.includes(value)) throw new TypeError(`${name} has an unsupported value`);
  return value;
}

export function locale(value: string): string {
  if (!/^[a-z]{2,3}_[A-Z]{2}$/.test(value)) {
    throw new TypeError("Locales must use language_TERRITORY, for example en_US");
  }
  return value;
}

/** Extended calendar dates and datetimes, with optional seconds, fraction and zone. */
export function dateTime(value: string | Date, name: string, requireSeconds = false): string {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) throw new TypeError(`${name} is an invalid Date`);
    return value.toISOString();
  }
  const match =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:[.,]\d+)?)?(?:Z|([+-])(\d{2}):?(\d{2}))?)?$/.exec(
      value,
    );
  if (!match) throw new TypeError(`${name} must be an ISO calendar date or datetime`);
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = match;
  const y = Number(year),
    m = Number(month),
    d = Number(day);
  const days = [
    31,
    y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  if (
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > days[m - 1]! ||
    (hour !== undefined && Number(hour) > 23) ||
    Number(minute ?? 0) > 59 ||
    Number(second ?? 0) > 59 ||
    Number(offsetHour ?? 0) > 23 ||
    Number(offsetMinute ?? 0) > 59 ||
    (requireSeconds && second === undefined)
  ) {
    throw new TypeError(
      `${name} is not a valid ${requireSeconds ? "datetime with seconds" : "calendar date or datetime"}`,
    );
  }
  return value;
}

export function mimeType(value: string, name: string): string {
  // RFC token type/subtype, followed by optional token or quoted parameters.
  const token = "[!#$%&'*+.^_`|~0-9A-Za-z-]+";
  const parameter = `${token}=(?:${token}|"(?:[^"\\\\\\r\\n]|\\\\[^\\r\\n])*")`;
  const pattern = new RegExp(`^${token}/${token}(?:[ \\t]*;[ \\t]*${parameter})*$`);
  if (typeof value !== "string" || !pattern.test(value))
    throw new TypeError(`${name} must be a MIME type`);
  return value;
}
