import { describe, expect, it } from "vitest";
import {
  OG_NAMESPACES,
  OG_PROPERTIES,
  openGraphMetaTags,
  metaTags,
  type OpenGraphMetadataOptions,
  type OgProperty,
} from "./index.js";

function base() {
  return {
    title: "A preview",
    url: "https://example.com/",
    images: [{ url: "https://example.com/poster.png", alt: "A poster" }],
  };
}
function entries(markup: string): string[] {
  return [...markup.matchAll(/<meta property="([^"]+)" content="([^"]*)" \/>/g)].map(
    (m) => `${m[1]}=${m[2]}`,
  );
}
function unsafe(value: unknown): OpenGraphMetadataOptions {
  return value as OpenGraphMetadataOptions;
}
const url = "https://example.com/object";
const video = {
  actors: [{ url, role: "Lead" }],
  directors: [url],
  writers: [url],
  duration: 120,
  releaseDate: "2026-11-08",
  tags: ["demo"],
};
const fixtures: readonly OpenGraphMetadataOptions[] = [
  {
    ...base(),
    type: "article",
    article: {
      publishedTime: "2026-11-01",
      modifiedTime: "2026-11-02T12:30:15Z",
      expirationTime: "2027-01-01",
      authors: [url],
      section: "Technology",
      tags: ["one", "two"],
    },
  },
  {
    ...base(),
    type: "book",
    book: {
      authors: [url],
      isbn: "978-3-16-148410-0",
      releaseDate: "2026-11-08",
      tags: ["reference"],
    },
  },
  {
    ...base(),
    type: "profile",
    profile: { firstName: "Ada", lastName: "Lovelace", username: "ada", gender: "female" },
  },
  {
    ...base(),
    type: "music.song",
    music: { duration: 180, albums: [{ url, disc: 1, track: 3 }], musicians: [url] },
  },
  {
    ...base(),
    type: "music.album",
    music: { songs: [{ url, disc: 2, track: 4 }], musicians: [url], releaseDate: "2026-11-08" },
  },
  {
    ...base(),
    type: "music.playlist",
    music: { songs: [{ url, disc: 1, track: 1 }], creators: [url] },
  },
  { ...base(), type: "music.radio_station", music: { creators: [url] } },
  { ...base(), type: "video.movie", video },
  { ...base(), type: "video.tv_show", video },
  { ...base(), type: "video.other", video },
  { ...base(), type: "video.episode", video: { ...video, series: url } },
  {
    ...base(),
    type: "payment.link",
    payment: {
      description: "A payment",
      currency: "USD",
      amount: 12.5,
      expiresAt: "2026-11-08T13:00:00Z",
      status: "PENDING",
      id: "payment-1",
      successUrl: url,
    },
  },
];

describe("Open Graph core and media", () => {
  it("renders required fields and defaults to website", () => {
    expect(entries(openGraphMetaTags(base()))).toEqual([
      "og:title=A preview",
      "og:type=website",
      "og:url=https://example.com/",
      "og:image=https://example.com/poster.png",
      "og:image:alt=A poster",
    ]);
  });

  it("emits every optional core and structured media property in root order", () => {
    const markup = openGraphMetaTags({
      ...base(),
      description: "A description",
      determiner: "",
      locale: "en_US",
      alternateLocales: ["fr_FR", "ja_JP"],
      siteName: "Example",
      images: [
        {
          url: "http://example.com/one.png",
          secureUrl: "https://example.com/one.png",
          type: "image/png",
          width: 1200,
          height: 630,
          alt: "First",
        },
        { url: "https://example.com/two.png", alt: "" },
      ],
      videos: [
        {
          url: "http://example.com/one.mp4",
          secureUrl: "https://example.com/one.mp4",
          type: "video/mp4",
          width: 640,
          height: 360,
          alt: "First video",
        },
        { url: "https://example.com/two.webm", type: "video/webm" },
      ],
      audio: [
        {
          url: "http://example.com/sound.mp3",
          secureUrl: "https://example.com/sound.mp3",
          type: "audio/mpeg",
        },
        { url: "https://example.com/other.ogg" },
      ],
    });
    expect(entries(markup)).toEqual([
      "og:title=A preview",
      "og:type=website",
      "og:url=https://example.com/",
      "og:description=A description",
      "og:determiner=",
      "og:locale=en_US",
      "og:locale:alternate=fr_FR",
      "og:locale:alternate=ja_JP",
      "og:site_name=Example",
      "og:image=http://example.com/one.png",
      "og:image:secure_url=https://example.com/one.png",
      "og:image:type=image/png",
      "og:image:width=1200",
      "og:image:height=630",
      "og:image:alt=First",
      "og:image=https://example.com/two.png",
      "og:image:alt=",
      "og:video=http://example.com/one.mp4",
      "og:video:secure_url=https://example.com/one.mp4",
      "og:video:type=video/mp4",
      "og:video:width=640",
      "og:video:height=360",
      "og:video:alt=First video",
      "og:video=https://example.com/two.webm",
      "og:video:type=video/webm",
      "og:audio=http://example.com/sound.mp3",
      "og:audio:secure_url=https://example.com/sound.mp3",
      "og:audio:type=audio/mpeg",
      "og:audio=https://example.com/other.ogg",
    ]);
  });

  it.each(["a", "an", "the", "", "auto"] as const)("preserves determiner %s", (determiner) => {
    expect(entries(openGraphMetaTags({ ...base(), determiner }))).toContain(
      `og:determiner=${determiner}`,
    );
  });

  it("does not require optional video dimensions, MIME type, or audio properties", () => {
    const tags = entries(openGraphMetaTags({ ...base(), videos: [{ url }], audio: [{ url }] }));
    expect(tags.slice(-2)).toEqual([`og:video=${url}`, `og:audio=${url}`]);
  });

  it("escapes text and signed URLs without reordering or normalizing them", () => {
    const signed = 'https://example.com/image.png?sig=%2f%2B&x="tag"';
    const markup = openGraphMetaTags({
      ...base(),
      title: '"/><script>bad</script>',
      description: "one & two",
      images: [{ url: signed, alt: "A < B's poster" }],
    });
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&quot;/&gt;&lt;script&gt;bad&lt;/script&gt;");
    expect(markup).toContain("sig=%2f%2B&amp;x=&quot;tag&quot;");
    expect(markup).toContain("A &lt; B&#39;s poster");
  });

  it.each([
    "video/mp4",
    "image/svg+xml",
    'audio/ogg; codecs="opus"',
    'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'video/mp4; note="a;b"',
  ])("accepts MIME type %s", (type) => {
    expect(() => openGraphMetaTags({ ...base(), videos: [{ url, type }] })).not.toThrow();
  });
});

describe("Open Graph object vocabularies", () => {
  it.each(fixtures)("supports $type with its namespaced fields", (fixture) => {
    const result = entries(openGraphMetaTags(fixture));
    expect(result).toContain(`og:type=${fixture.type}`);
    expect(result.some((entry) => !entry.startsWith("og:"))).toBe(true);
    expect(result.every((entry) => !entry.endsWith("=undefined"))).toBe(true);
  });

  it("matches all typed vocabulary property names, including the payment beta", () => {
    const actual = new Set(
      fixtures.flatMap((fixture) =>
        entries(openGraphMetaTags(fixture))
          .map((entry) => entry.split("=")[0]!)
          .filter((key) => !key.startsWith("og:")),
      ),
    );
    expect([...actual].toSorted()).toEqual(
      [
        "article:published_time",
        "article:modified_time",
        "article:expiration_time",
        "article:author",
        "article:section",
        "article:tag",
        "book:author",
        "book:isbn",
        "book:release_date",
        "book:tag",
        "profile:first_name",
        "profile:last_name",
        "profile:username",
        "profile:gender",
        "music:duration",
        "music:album",
        "music:album:disc",
        "music:album:track",
        "music:musician",
        "music:song",
        "music:song:disc",
        "music:song:track",
        "music:release_date",
        "music:creator",
        "video:actor",
        "video:actor:role",
        "video:director",
        "video:writer",
        "video:duration",
        "video:release_date",
        "video:tag",
        "video:series",
        "payment:description",
        "payment:currency",
        "payment:amount",
        "payment:expires_at",
        "payment:status",
        "payment:id",
        "payment:success_url",
      ].toSorted(),
    );
    expect(OG_PROPERTIES.filter((key) => !key.startsWith("og:")).toSorted()).toEqual(
      [...actual].toSorted(),
    );
    expect(OG_PROPERTIES.length).toBe(new Set(OG_PROPERTIES).size);
  });

  it("keeps song positions attached to each source without sorting or deduplication", () => {
    expect(
      entries(
        openGraphMetaTags({
          ...base(),
          type: "music.playlist",
          music: {
            songs: [
              { url: "https://example.com/b", disc: 2, track: 3 },
              { url: "https://example.com/a", track: 1 },
              { url: "https://example.com/b" },
            ],
            creators: [url, url],
          },
        }),
      ).slice(5),
    ).toEqual([
      "music:song=https://example.com/b",
      "music:song:disc=2",
      "music:song:track=3",
      "music:song=https://example.com/a",
      "music:song:track=1",
      "music:song=https://example.com/b",
      `music:creator=${url}`,
      `music:creator=${url}`,
    ]);
  });

  it("keeps every actor's role beside its profile URL", () => {
    expect(
      entries(
        openGraphMetaTags({
          ...base(),
          type: "video.episode",
          video: {
            actors: [
              { url: "https://example.com/ada", role: "Lead" },
              { url: "https://example.com/grace" },
            ],
            series: url,
          },
        }),
      ).slice(5),
    ).toEqual([
      "video:actor=https://example.com/ada",
      "video:actor:role=Lead",
      "video:actor=https://example.com/grace",
      `video:series=${url}`,
    ]);
  });

  it("preserves zero payment amounts and accepts all documented payment states", () => {
    for (const status of ["PENDING", "PAID", "FAILED", "EXPIRED"] as const) {
      const result = entries(
        openGraphMetaTags({ ...base(), type: "payment.link", payment: { amount: 0, status } }),
      );
      expect(result).toContain("payment:amount=0");
      expect(result).toContain(`payment:status=${status}`);
    }
  });

  it("lets a typed object omit its optional fields", () => {
    for (const fixture of fixtures) {
      const config = { ...base(), type: fixture.type ?? "website" };
      expect(entries(openGraphMetaTags(config))).toHaveLength(5);
    }
  });

  it("rejects mismatched verticals in JavaScript and TypeScript", () => {
    const invalid: OpenGraphMetadataOptions = {
      ...base(),
      type: "profile",
      // @ts-expect-error Article fields cannot be attached to a profile.
      article: { section: "News" },
    };
    expect(() => openGraphMetaTags(invalid)).toThrow("does not belong");
    expect(() =>
      openGraphMetaTags(unsafe({ ...base(), type: "video.movie", video: { series: url } })),
    ).toThrow("Unsupported object metadata field");
    expect(() =>
      openGraphMetaTags(
        unsafe({ ...base(), type: "music.radio_station", music: { songs: [{ url }] } }),
      ),
    ).toThrow("Unsupported object metadata field");
  });
});

describe("Open Graph validation", () => {
  it.each([
    "/relative",
    "javascript:bad",
    "data:image/png;base64,AA==",
    "https:example.com",
    "https://user:pass@example.com/",
    "https://example.com/a b",
    "https://example.com/a\nb",
  ])("rejects URL %s in every URI-bearing context", (invalidUrl) => {
    const configs: unknown[] = [
      { ...base(), url: invalidUrl },
      { ...base(), images: [{ url: invalidUrl, alt: "Poster" }] },
      { ...base(), videos: [{ url: invalidUrl }] },
      { ...base(), audio: [{ url: invalidUrl }] },
      { ...base(), type: "article", article: { authors: [invalidUrl] } },
      { ...base(), type: "book", book: { authors: [invalidUrl] } },
      {
        ...base(),
        type: "music.song",
        music: { albums: [{ url: invalidUrl }], musicians: [invalidUrl] },
      },
      {
        ...base(),
        type: "music.playlist",
        music: { songs: [{ url: invalidUrl }], creators: [invalidUrl] },
      },
      {
        ...base(),
        type: "video.episode",
        video: {
          actors: [{ url: invalidUrl }],
          directors: [invalidUrl],
          writers: [invalidUrl],
          series: invalidUrl,
        },
      },
      { ...base(), type: "payment.link", payment: { successUrl: invalidUrl } },
    ];
    for (const config of configs)
      expect(() => openGraphMetaTags(unsafe(config))).toThrow(TypeError);
  });

  it("rejects missing media roots and orphan structured references", () => {
    for (const config of [
      { ...base(), images: [{ alt: "Missing URL" }] },
      { ...base(), videos: [{}] },
      { ...base(), audio: [{}] },
      { ...base(), type: "video.movie", video: { actors: [{ role: "Lead" }] } },
      { ...base(), type: "music.song", music: { albums: [{ disc: 1 }] } },
    ])
      expect(() => openGraphMetaTags(unsafe(config))).toThrow(TypeError);
  });

  it("requires HTTPS secure URLs for all media", () => {
    for (const field of ["images", "videos", "audio"]) {
      expect(() =>
        openGraphMetaTags(
          unsafe({
            ...base(),
            [field]: [
              {
                url,
                ...(field === "audio" ? {} : { alt: "Poster" }),
                secureUrl: "http://example.com/",
              },
            ],
          }),
        ),
      ).toThrow("HTTPS");
    }
  });

  it("rejects non-array lists, malformed vertical objects, and audio dimensions", () => {
    for (const config of [
      { ...base(), audio: { url } },
      { ...base(), videos: { url } },
      { ...base(), alternateLocales: "en_US" },
      { ...base(), extensions: {} },
      { ...base(), type: "article", article: { tags: "one" } },
      { ...base(), type: "article", article: null },
      { ...base(), type: "video.movie", video: [] },
      { ...base(), audio: [{ url, width: 100 }] },
    ])
      expect(() => openGraphMetaTags(unsafe(config))).toThrow(TypeError);
  });

  it.each([0, -1, 1.2, Infinity, NaN, 2147483648])(
    "rejects non-positive or out-of-range integer %s",
    (value) => {
      for (const config of [
        { ...base(), images: [{ url, alt: "Poster", width: value }] },
        { ...base(), videos: [{ url, height: value }] },
        { ...base(), type: "music.song", music: { duration: value } },
        { ...base(), type: "music.album", music: { songs: [{ url, track: value }] } },
        { ...base(), type: "music.song", music: { albums: [{ url, disc: value }] } },
        { ...base(), type: "video.movie", video: { duration: value } },
      ])
        expect(() => openGraphMetaTags(unsafe(config))).toThrow("positive 32-bit integer");
    },
  );

  it.each([
    "2024-02-29",
    "2000-02-29T12:30",
    "2026-11-08T12:30:45.123Z",
    "2026-11-08T12:30:45,25+0530",
    "2026-11-08T12:30:45-05:00",
  ])("accepts calendar date %s", (publishedTime) => {
    expect(
      entries(openGraphMetaTags({ ...base(), type: "article", article: { publishedTime } })),
    ).toContain(`article:published_time=${publishedTime}`);
  });

  it.each([
    "not a date",
    "2025-02-29",
    "1900-02-29",
    "2026-13-01",
    "2026-01-00",
    "2026-04-31",
    "2026-11-08T24:00",
    "2026-11-08T12:60:00",
    "2026-11-08T12:30:00+24:00",
  ])("rejects invalid date %s", (publishedTime) => {
    expect(() =>
      openGraphMetaTags({ ...base(), type: "article", article: { publishedTime } }),
    ).toThrow(TypeError);
  });

  it("normalizes Date values and requires seconds on payment expirations", () => {
    const date = new Date("2026-11-08T12:30:00-05:00");
    expect(
      entries(openGraphMetaTags({ ...base(), type: "book", book: { releaseDate: date } })),
    ).toContain("book:release_date=2026-11-08T17:30:00.000Z");
    expect(() =>
      openGraphMetaTags({ ...base(), type: "book", book: { releaseDate: new Date(NaN) } }),
    ).toThrow("invalid Date");
    for (const expiresAt of ["2026-11-08", "2026-11-08T12:30"])
      expect(() =>
        openGraphMetaTags({ ...base(), type: "payment.link", payment: { expiresAt } }),
      ).toThrow("with seconds");
  });

  it.each([
    "",
    "image",
    "video/",
    "video/mp4\n",
    'video/mp4; codecs="unclosed',
    "video/mp4; missing",
  ])("rejects malformed MIME type %s", (type) => {
    expect(() => openGraphMetaTags({ ...base(), audio: [{ url, type }] })).toThrow("MIME type");
  });

  it("validates enums, locales, currency format, finite amounts and required fields", () => {
    for (const config of [
      { ...base(), title: "" },
      { ...base(), images: [] },
      { ...base(), images: [{ url }] },
      { ...base(), determiner: "some" },
      { ...base(), locale: "en-US" },
      { ...base(), alternateLocales: ["fr"] },
      { ...base(), type: "profile", profile: { gender: "unknown" } },
      { ...base(), type: "payment.link", payment: { currency: "usd" } },
      { ...base(), type: "payment.link", payment: { amount: Infinity } },
      { ...base(), type: "payment.link", payment: { status: "paid" } },
      { ...base(), type: "typo" },
    ])
      expect(() => openGraphMetaTags(unsafe(config))).toThrow(TypeError);
  });
});

describe("Custom namespaces and low-level tags", () => {
  it("supports custom object types and ordered extension properties", () => {
    expect(
      entries(
        openGraphMetaTags({
          ...base(),
          type: "app:document",
          extensions: [
            { property: "app:ready", content: false },
            { property: "app:count", content: 0 },
            { property: "app:tag", content: "b" },
            { property: "app:tag", content: "a" },
          ],
        }),
      ).slice(-4),
    ).toEqual(["app:ready=false", "app:count=0", "app:tag=b", "app:tag=a"]);
  });

  it("prevents every standard property from being overridden by extensions", () => {
    for (const property of OG_PROPERTIES)
      expect(() =>
        openGraphMetaTags({ ...base(), extensions: [{ property, content: "override" }] }),
      ).toThrow("Use typed fields");
  });

  it("serializes aliases, deprecated tags, booleans, floats and repeated roots explicitly", () => {
    const tags: OgProperty[] = [
      { property: "og:image:url", content: url },
      { property: "og:image:width", content: 1200 },
      { property: "og:video:url", content: url },
      { property: "og:audio:url", content: url },
      { property: "og:latitude", content: -1.25 },
      { property: "app:ready", content: false },
      { property: "app:ready", content: true },
      { property: "app:text", content: "" },
    ];
    expect(entries(metaTags(tags))).toEqual(
      tags.map(({ property, content }) => `${property}=${content}`),
    );
  });

  it.each([
    'og:image" onload="bad',
    "og:image><script>",
    "unprefixed",
    ":image",
    "app:",
    "app:key\n",
  ])("rejects malformed property %s", (property) => {
    expect(() => metaTags([{ property, content: "data" }])).toThrow("namespaced");
  });

  it("escapes extension values and rejects unsupported or non-finite values", () => {
    expect(metaTags([{ property: "app:key", content: "\"/><script>&'" }])).toContain(
      "&quot;/&gt;&lt;script&gt;&amp;&#39;",
    );
    for (const content of [NaN, Infinity, null, undefined, {}, []]) {
      expect(() => metaTags([{ property: "app:key", content }] as OgProperty[])).toThrow(TypeError);
    }
  });

  it("exposes namespace URIs for every documented vocabulary", () => {
    expect(Object.keys(OG_NAMESPACES)).toEqual([
      "og",
      "article",
      "book",
      "profile",
      "music",
      "video",
      "payment",
    ]);
    expect(OG_NAMESPACES).toEqual({
      og: "https://ogp.me/ns#",
      article: "https://ogp.me/ns/article#",
      book: "https://ogp.me/ns/book#",
      profile: "http://ogp.me/ns/profile#",
      music: "https://ogp.me/ns/music#",
      video: "https://ogp.me/ns/video#",
      payment: "https://ogp.me/ns/payment#",
    });
  });
});
