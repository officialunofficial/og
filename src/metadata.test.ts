import { describe, expect, it } from "vitest";
import { videoMetaTags, type VideoMetadataOptions } from "./index.js";

function options(): VideoMetadataOptions {
  return {
    title: "Store it. Share it.",
    url: "https://blob.uno.fun/",
    image: {
      url: "https://blob.uno.fun/share.png",
      alt: "Blob's Lagoon symbol",
      type: "image/png",
      width: 1200,
      height: 630,
    },
    videos: [
      { url: "https://blob.uno.fun/preview.mp4", type: "video/mp4", width: 1200, height: 630 },
    ],
  };
}

describe("videoMetaTags", () => {
  it("exports a renderer-free helper that emits a poster and a complete video source", () => {
    expect(videoMetaTags(options()).split("\n")).toEqual([
      '<meta property="og:title" content="Store it. Share it." />',
      '<meta property="og:type" content="website" />',
      '<meta property="og:url" content="https://blob.uno.fun/" />',
      '<meta property="og:image" content="https://blob.uno.fun/share.png" />',
      '<meta property="og:image:type" content="image/png" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      '<meta property="og:image:alt" content="Blob&#39;s Lagoon symbol" />',
      '<meta property="og:video" content="https://blob.uno.fun/preview.mp4" />',
      '<meta property="og:video:type" content="video/mp4" />',
      '<meta property="og:video:width" content="1200" />',
      '<meta property="og:video:height" content="630" />',
    ]);
  });

  it("keeps each alternate source's structured properties with its root", () => {
    const config = options();
    config.videos = [
      {
        url: "http://example.com/movie.mp4",
        secureUrl: "https://example.com/movie.mp4",
        type: "video/mp4",
        width: 1200,
        height: 630,
      },
      { url: "https://example.com/movie.webm", type: "video/webm", width: 640, height: 360 },
    ];
    const tags = videoMetaTags(config).split("\n");
    expect(tags.slice(tags.findIndex((tag) => tag.includes('property="og:video"')))).toEqual([
      '<meta property="og:video" content="http://example.com/movie.mp4" />',
      '<meta property="og:video:secure_url" content="https://example.com/movie.mp4" />',
      '<meta property="og:video:type" content="video/mp4" />',
      '<meta property="og:video:width" content="1200" />',
      '<meta property="og:video:height" content="630" />',
      '<meta property="og:video" content="https://example.com/movie.webm" />',
      '<meta property="og:video:type" content="video/webm" />',
      '<meta property="og:video:width" content="640" />',
      '<meta property="og:video:height" content="360" />',
    ]);
  });

  it("supports optional page metadata and poster fields without emitting undefined values", () => {
    const config = options();
    config.type = "video.other";
    config.description = "A quick look at Blob.";
    config.image = {
      url: "http://example.com/poster.png",
      secureUrl: "https://example.com/poster.png",
      alt: "The video poster",
    };
    const result = videoMetaTags(config);
    expect(result).toContain('property="og:type" content="video.other"');
    expect(result).toContain('property="og:description" content="A quick look at Blob."');
    expect(result).toContain(
      'property="og:image:secure_url" content="https://example.com/poster.png"',
    );
    expect(result).not.toContain('property="og:image:width"');
    expect(result).not.toContain("undefined");
  });

  it("escapes HTML in metadata and preserves signed query strings", () => {
    const config = options();
    config.title = 'A "title" <script>alert(1)</script>';
    config.description = "one & two";
    config.image.alt = 'Poster " onload="bad';
    config.videos = [
      { ...config.videos[0]!, url: "https://example.com/video.mp4?b=2&a=1&sig=%2f%2B" },
    ];
    const result = videoMetaTags(config);
    expect(result).toContain('content="A &quot;title&quot; &lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(result).toContain('content="one &amp; two"');
    expect(result).toContain('content="Poster &quot; onload=&quot;bad"');
    expect(result).toContain('content="https://example.com/video.mp4?b=2&amp;a=1&amp;sig=%2f%2B"');
    expect(result).not.toContain("<script>");
  });

  it.each([
    "",
    "https:example.com/video.mp4",
    "//example.com/video.mp4",
    "ftp://example.com/video.mp4",
    "/relative.mp4",
    "javascript:alert(1)",
    "data:video/mp4;base64,AA==",
    "https://user:secret@example.com/video.mp4",
    "https://example.com/with space.mp4",
    "https://example.com/\nvideo.mp4",
  ])("rejects invalid or unsafe media URL %s", (url) => {
    const config = options();
    for (const mutate of [
      () => {
        config.url = url;
      },
      () => {
        config.image.url = url;
      },
      () => {
        config.videos = [{ ...options().videos[0]!, url }];
      },
    ]) {
      Object.assign(config, options());
      mutate();
      expect(() => videoMetaTags(config)).toThrow(TypeError);
    }
  });

  it("requires HTTPS for secure URLs", () => {
    const config = options();
    config.image.secureUrl = "http://example.com/image.png";
    expect(() => videoMetaTags(config)).toThrow("HTTPS");
    delete config.image.secureUrl;
    config.videos = [{ ...config.videos[0]!, secureUrl: "http://example.com/video.mp4" }];
    expect(() => videoMetaTags(config)).toThrow("HTTPS");
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid dimensions %s",
    (value) => {
      const config = options();
      config.image.width = value;
      expect(() => videoMetaTags(config)).toThrow("positive integer");
      config.image = options().image;
      config.image.height = value;
      expect(() => videoMetaTags(config)).toThrow("positive integer");
      config.image = options().image;
      config.videos = [{ ...options().videos[0]!, width: value }];
      expect(() => videoMetaTags(config)).toThrow("positive integer");
      config.videos = [{ ...options().videos[0]!, height: value }];
      expect(() => videoMetaTags(config)).toThrow("positive integer");
    },
  );

  it("requires a video source, page title, poster description, and MIME type", () => {
    expect(() => videoMetaTags({ ...options(), videos: [] })).toThrow("at least one");
    expect(() => videoMetaTags({ ...options(), title: " " })).toThrow("title");
    const config = options();
    config.image.alt = "";
    expect(() => videoMetaTags(config)).toThrow("image.alt");
    config.image = options().image;
    config.videos = [{ ...config.videos[0]!, type: "" }];
    expect(() => videoMetaTags(config)).toThrow("video.type");
  });
});
