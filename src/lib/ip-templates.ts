import {
  Music, Palette, FileText, Hexagon, Clapperboard, Camera,
  Award, MessageSquare, BookOpen, Building2, Code2, Layers,
  Music2, AudioLines, Youtube, Video, Twitter, Instagram, Facebook, Globe,
  type LucideIcon,
} from "lucide-react";
import type { IPType } from "@/types/ip";

// ── Embeds (inline iframe players) ──────────────────────────────────────────
// Only platforms with clean iframe embeds. Each maps to a stored trait_type key
// so the asset page can render the player from metadata attributes.
export type EmbedPlatform = "spotify" | "soundcloud" | "youtube" | "tiktok" | "vimeo";

export const EMBED_PLATFORM_META: Record<
  EmbedPlatform,
  { label: string; icon: LucideIcon; traitKey: string; placeholder: string }
> = {
  spotify:    { label: "Spotify",    icon: Music2,     traitKey: "Spotify URL",    placeholder: "https://open.spotify.com/…" },
  soundcloud: { label: "SoundCloud", icon: AudioLines, traitKey: "SoundCloud URL", placeholder: "https://soundcloud.com/…" },
  youtube:    { label: "YouTube",    icon: Youtube,    traitKey: "YouTube URL",    placeholder: "https://youtube.com/watch?v=…" },
  tiktok:     { label: "TikTok",     icon: Video,      traitKey: "TikTok URL",     placeholder: "https://tiktok.com/@…/video/…" },
  vimeo:      { label: "Vimeo",      icon: Video,      traitKey: "Vimeo URL",      placeholder: "https://vimeo.com/…" },
};

// ── Socials (icon-chip links — open in a new tab, never iframed) ────────────
// X / Instagram / Facebook need fragile JS SDKs and sites block iframing, so
// these render as clickable platform chips on the asset page, not players.
export type SocialPlatform = "x" | "instagram" | "facebook" | "tiktok" | "website";

export const SOCIAL_PLATFORM_META: Record<
  SocialPlatform,
  { label: string; icon: LucideIcon; traitKey: string; placeholder: string }
> = {
  x:         { label: "X",         icon: Twitter,   traitKey: "X",         placeholder: "https://x.com/…" },
  instagram: { label: "Instagram", icon: Instagram, traitKey: "Instagram", placeholder: "https://instagram.com/…" },
  facebook:  { label: "Facebook",  icon: Facebook,  traitKey: "Facebook",  placeholder: "https://facebook.com/…" },
  tiktok:    { label: "TikTok",    icon: Video,     traitKey: "TikTok",    placeholder: "https://tiktok.com/@…" },
  website:   { label: "Website",   icon: Globe,     traitKey: "Website",   placeholder: "https://…" },
};

// ── Trait suggestions (friendly, no dates / no technical fields) ────────────
// Tapping a suggestion pre-fills a trait row. Optional `options` renders the
// value as a select (e.g. Rarity).
export interface TraitSuggestion {
  key: string;
  placeholder?: string;
  options?: string[];
}

export interface IPTemplate {
  type: IPType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: { bg: string; text: string; border: string };
  embeds?: EmbedPlatform[];
  socials?: SocialPlatform[];
  traitSuggestions?: TraitSuggestion[];
}

export const IP_TEMPLATES: Record<IPType, IPTemplate> = {
  Audio: {
    type: "Audio",
    label: "Audio",
    description: "Music, podcasts, sound effects, audio art",
    icon: Music,
    color: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    embeds: ["spotify", "soundcloud"],
    traitSuggestions: [
      { key: "Artist" }, { key: "Genre", placeholder: "Soundtrack" }, { key: "Mood" }, { key: "Label" },
    ],
  },
  Video: {
    type: "Video",
    label: "Video",
    description: "Films, animations, short-form video content",
    icon: Clapperboard,
    color: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    embeds: ["youtube", "tiktok", "vimeo"],
    traitSuggestions: [
      { key: "Director" }, { key: "Genre" }, { key: "Cast" }, { key: "Studio" },
    ],
  },
  Art: {
    type: "Art",
    label: "Art",
    description: "Digital and physical artwork, illustrations, generative art",
    icon: Palette,
    color: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    traitSuggestions: [
      { key: "Medium", placeholder: "Oil on canvas" },
      { key: "Style", placeholder: "Impressionism" },
      { key: "Materials" },
      { key: "Series" },
    ],
  },
  Photography: {
    type: "Photography",
    label: "Photography",
    description: "Photography, photo essays, visual documentation",
    icon: Camera,
    color: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    traitSuggestions: [
      { key: "Camera", placeholder: "Sony A7 IV" },
      { key: "Location" },
      { key: "Series" },
      { key: "Edition" },
    ],
  },
  Posts: {
    type: "Posts",
    label: "Posts",
    description: "Articles, blog posts, social media content, essays",
    icon: MessageSquare,
    color: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    socials: ["x", "instagram", "facebook", "tiktok", "website"],
    traitSuggestions: [
      { key: "Author" }, { key: "Topic" }, { key: "Category" },
    ],
  },
  Publications: {
    type: "Publications",
    label: "Publications",
    description: "Books, journals, magazines, academic papers",
    icon: BookOpen,
    color: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
    socials: ["x", "instagram", "website"],
    traitSuggestions: [
      { key: "Author" }, { key: "Publisher" }, { key: "Language", placeholder: "English" }, { key: "Edition" },
    ],
  },
  Documents: {
    type: "Documents",
    label: "Documents",
    description: "Contracts, reports, whitepapers, legal documents",
    icon: FileText,
    color: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
    traitSuggestions: [
      { key: "Author" }, { key: "Category" }, { key: "Language", placeholder: "English" },
    ],
  },
  Patents: {
    type: "Patents",
    label: "Patents",
    description: "Patents, inventions, technical innovations",
    icon: Award,
    color: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    traitSuggestions: [
      { key: "Inventor" }, { key: "Field" }, { key: "Status" },
    ],
  },
  Software: {
    type: "Software",
    label: "Software",
    description: "Applications, scripts, algorithms, code libraries",
    icon: Code2,
    color: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
    socials: ["website"],
    traitSuggestions: [
      { key: "Language", placeholder: "TypeScript" }, { key: "License" }, { key: "Platform" },
    ],
  },
  NFT: {
    type: "NFT",
    label: "NFT",
    description: "Blockchain-native digital assets and collectibles",
    icon: Hexagon,
    color: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    traitSuggestions: [
      { key: "Collection" },
      { key: "Edition" },
      { key: "Rarity", options: ["Common", "Uncommon", "Rare", "Epic", "Legendary"] },
    ],
  },
  RWA: {
    type: "RWA",
    label: "Real World Asset",
    description: "Tokenized physical assets: real estate, commodities, collectibles",
    icon: Building2,
    color: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    traitSuggestions: [
      { key: "Asset Type" }, { key: "Location" }, { key: "Category" },
    ],
  },
  Custom: {
    type: "Custom",
    label: "Custom",
    description: "Custom IP type — add your own trait pairs for any metadata",
    icon: Layers,
    color: { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border" },
  },
};

/**
 * All trait_type keys owned by templates (embeds + socials + suggestions), plus
 * "IP Type" itself. Used to filter template-managed attributes out of other
 * attribute grids so they aren't duplicated.
 */
export const TEMPLATE_TRAIT_TYPES = new Set<string>([
  "IP Type",
  ...Object.values(EMBED_PLATFORM_META).map((m) => m.traitKey),
  ...Object.values(SOCIAL_PLATFORM_META).map((m) => m.traitKey),
  ...Object.values(IP_TEMPLATES).flatMap((t) => (t.traitSuggestions ?? []).map((s) => s.key)),
]);
