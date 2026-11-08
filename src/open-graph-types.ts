/** Media fields shared by images, audio and video. URLs are never fetched. */
export type OgMedia = {
  url: string;
  secureUrl?: string;
  type?: string;
};
export type OgImage = OgMedia & { alt: string; width?: number; height?: number };
export type OgVideoMedia = OgMedia & { alt?: string; width?: number; height?: number };
export type OgAudio = OgMedia;
export type OgDateTime = string | Date;
export type OgDeterminer = "a" | "an" | "the" | "" | "auto";

export type OgArticle = {
  publishedTime?: OgDateTime;
  modifiedTime?: OgDateTime;
  expirationTime?: OgDateTime;
  authors?: readonly string[];
  section?: string;
  tags?: readonly string[];
};
export type OgBook = {
  authors?: readonly string[];
  isbn?: string;
  releaseDate?: OgDateTime;
  tags?: readonly string[];
};
export type OgProfile = {
  firstName?: string;
  lastName?: string;
  username?: string;
  gender?: "male" | "female";
};
/** A song or album URL with its own disc and track position. */
export type OgMusicReference = { url: string; disc?: number; track?: number };
export type OgMusicSong = {
  duration?: number;
  albums?: readonly OgMusicReference[];
  musicians?: readonly string[];
};
export type OgMusicAlbum = {
  songs?: readonly OgMusicReference[];
  musicians?: readonly string[];
  releaseDate?: OgDateTime;
};
export type OgMusicPlaylist = { songs?: readonly OgMusicReference[]; creators?: readonly string[] };
export type OgMusicRadioStation = { creators?: readonly string[] };
export type OgActor = { url: string; role?: string };
export type OgVideoDetails = {
  actors?: readonly OgActor[];
  directors?: readonly string[];
  writers?: readonly string[];
  duration?: number;
  releaseDate?: OgDateTime;
  tags?: readonly string[];
};
export type OgVideoEpisode = OgVideoDetails & { series?: string };
/** payment.link is a beta vocabulary in the Open Graph specification. */
export type OgPayment = {
  description?: string;
  currency?: string;
  amount?: number;
  expiresAt?: OgDateTime;
  status?: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  id?: string;
  successUrl?: string;
};

export type OgObject =
  | { type?: "website" }
  | { type: "article"; article?: OgArticle }
  | { type: "book"; book?: OgBook }
  | { type: "profile"; profile?: OgProfile }
  | { type: "music.song"; music?: OgMusicSong }
  | { type: "music.album"; music?: OgMusicAlbum }
  | { type: "music.playlist"; music?: OgMusicPlaylist }
  | { type: "music.radio_station"; music?: OgMusicRadioStation }
  | { type: "video.movie" | "video.tv_show" | "video.other"; video?: OgVideoDetails }
  | { type: "video.episode"; video?: OgVideoEpisode }
  | { type: "payment.link"; payment?: OgPayment }
  | { type: `${string}:${string}` };

/** An ordered property/value pair for a custom vocabulary or low-level serialization. */
export type OgProperty = { property: string; content: string | number | boolean };

export type OpenGraphMetadataOptions = OgObject & {
  title: string;
  url: string;
  images: readonly OgImage[];
  description?: string;
  determiner?: OgDeterminer;
  locale?: string;
  alternateLocales?: readonly string[];
  siteName?: string;
  videos?: readonly OgVideoMedia[];
  audio?: readonly OgAudio[];
  /** Custom fields only: official properties must use their typed options. */
  extensions?: readonly OgProperty[];
};

/** Declare these RDFa prefixes on the document's html element as needed. */
export const OG_NAMESPACES = {
  og: "https://ogp.me/ns#",
  article: "https://ogp.me/ns/article#",
  book: "https://ogp.me/ns/book#",
  profile: "https://ogp.me/ns/profile#",
  music: "https://ogp.me/ns/music#",
  video: "https://ogp.me/ns/video#",
  payment: "https://ogp.me/ns/payment#",
} as const;
