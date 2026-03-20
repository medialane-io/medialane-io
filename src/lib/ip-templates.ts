import {
  Music, Palette, FileText, Hexagon, Clapperboard, Camera,
  Award, MessageSquare, BookOpen, Building2, Code2, Layers,
  type LucideIcon,
} from "lucide-react";
import type { IPType } from "@/types/ip";

export type EmbedType = "youtube" | "spotify" | "soundcloud" | "tiktok";

export interface TemplateField {
  /** Exact trait_type string stored in IPFS attributes (may contain spaces). */
  key: string;
  label: string;
  inputType: "text" | "url" | "number" | "date" | "select";
  placeholder?: string;
  options?: string[];
  /** If set and the attribute has a value, renders an embed player on the asset page. */
  embed?: EmbedType;
}

export interface IPTemplate {
  type: IPType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: { bg: string; text: string; border: string };
  fields: TemplateField[];
}

export const IP_TEMPLATES: Record<IPType, IPTemplate> = {
  Audio: {
    type: "Audio",
    label: "Audio",
    description: "Music, podcasts, sound effects, audio art",
    icon: Music,
    color: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    fields: [
      { key: "Artist",        label: "Artist",       inputType: "text" },
      { key: "Genre",         label: "Genre",        inputType: "text" },
      { key: "BPM",           label: "BPM",          inputType: "number", placeholder: "128" },
      { key: "Duration",      label: "Duration",     inputType: "text",   placeholder: "3:45" },
      { key: "Spotify URL",   label: "Spotify",      inputType: "url",    embed: "spotify" },
      { key: "SoundCloud URL",label: "SoundCloud",   inputType: "url",    embed: "soundcloud" },
    ],
  },
  Video: {
    type: "Video",
    label: "Video",
    description: "Films, animations, short-form video content",
    icon: Clapperboard,
    color: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
    fields: [
      { key: "Director",      label: "Director",     inputType: "text" },
      { key: "Genre",         label: "Genre",        inputType: "text" },
      { key: "Duration",      label: "Duration",     inputType: "text",   placeholder: "1:24:00" },
      { key: "Release Date",  label: "Release Date", inputType: "date" },
      { key: "YouTube URL",   label: "YouTube",      inputType: "url",    embed: "youtube" },
      { key: "TikTok URL",    label: "TikTok",       inputType: "url",    embed: "tiktok" },
    ],
  },
  Art: {
    type: "Art",
    label: "Art",
    description: "Digital and physical artwork, illustrations, generative art",
    icon: Palette,
    color: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
    fields: [
      { key: "Medium",        label: "Medium",       inputType: "text",   placeholder: "Oil on canvas" },
      { key: "Style",         label: "Style",        inputType: "text",   placeholder: "Impressionism" },
      { key: "Dimensions",    label: "Dimensions",   inputType: "text",   placeholder: "24 × 36 in" },
      { key: "Creation Date", label: "Creation Date",inputType: "date" },
      { key: "Materials",     label: "Materials",    inputType: "text" },
    ],
  },
  Photography: {
    type: "Photography",
    label: "Photography",
    description: "Photography, photo essays, visual documentation",
    icon: Camera,
    color: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    fields: [
      { key: "Camera",        label: "Camera",       inputType: "text",   placeholder: "Sony A7 IV" },
      { key: "Lens",          label: "Lens",         inputType: "text",   placeholder: "50mm f/1.4" },
      { key: "ISO",           label: "ISO",          inputType: "number", placeholder: "800" },
      { key: "Aperture",      label: "Aperture",     inputType: "text",   placeholder: "f/2.8" },
      { key: "Shutter Speed", label: "Shutter Speed",inputType: "text",   placeholder: "1/500s" },
      { key: "Location",      label: "Location",     inputType: "text" },
      { key: "Date Taken",    label: "Date Taken",   inputType: "date" },
    ],
  },
  Posts: {
    type: "Posts",
    label: "Posts",
    description: "Articles, blog posts, social media content, essays",
    icon: MessageSquare,
    color: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
    fields: [
      { key: "Publication Date", label: "Published",  inputType: "date" },
      { key: "Category",         label: "Category",   inputType: "text" },
      { key: "Word Count",       label: "Word Count", inputType: "number" },
      { key: "Read Time",        label: "Read Time",  inputType: "text",   placeholder: "5 min" },
    ],
  },
  Publications: {
    type: "Publications",
    label: "Publications",
    description: "Books, journals, magazines, academic papers",
    icon: BookOpen,
    color: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
    fields: [
      { key: "ISBN",          label: "ISBN",         inputType: "text" },
      { key: "Publisher",     label: "Publisher",    inputType: "text" },
      { key: "Format",        label: "Format",       inputType: "select", options: ["Hardcover", "Paperback", "eBook", "PDF", "Other"] },
      { key: "Release Date",  label: "Release Date", inputType: "date" },
    ],
  },
  Documents: {
    type: "Documents",
    label: "Documents",
    description: "Contracts, reports, whitepapers, legal documents",
    icon: FileText,
    color: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
    fields: [
      { key: "Category",      label: "Category",     inputType: "text" },
      { key: "Format",        label: "Format",       inputType: "select", options: ["PDF", "Word", "Markdown", "HTML", "Other"] },
      { key: "Language",      label: "Language",     inputType: "text",   placeholder: "English" },
      { key: "Publisher",     label: "Publisher",    inputType: "text" },
    ],
  },
  Patents: {
    type: "Patents",
    label: "Patents",
    description: "Patents, inventions, technical innovations",
    icon: Award,
    color: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    fields: [
      { key: "Inventor",      label: "Inventor",     inputType: "text" },
      { key: "Patent Number", label: "Patent No.",   inputType: "text" },
      { key: "Filing Date",   label: "Filing Date",  inputType: "date" },
      { key: "Patent Type",   label: "Type",         inputType: "select", options: ["Utility", "Design", "Plant", "Provisional"] },
    ],
  },
  Software: {
    type: "Software",
    label: "Software",
    description: "Applications, scripts, algorithms, code libraries",
    icon: Code2,
    color: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
    fields: [
      { key: "Version",        label: "Version",      inputType: "text",   placeholder: "1.0.0" },
      { key: "Release Date",   label: "Release Date", inputType: "date" },
      { key: "Language",       label: "Language",     inputType: "text",   placeholder: "TypeScript" },
      { key: "Repository URL", label: "Repository",   inputType: "url" },
    ],
  },
  NFT: {
    type: "NFT",
    label: "NFT",
    description: "Blockchain-native digital assets and collectibles",
    icon: Hexagon,
    color: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    fields: [
      { key: "Token Standard", label: "Standard",    inputType: "select", options: ["ERC-721", "ERC-1155", "SNIP-12", "Other"] },
      { key: "Blockchain",     label: "Blockchain",  inputType: "text",   placeholder: "Starknet" },
      { key: "Editions",       label: "Editions",    inputType: "number" },
      { key: "Rarity",         label: "Rarity",      inputType: "select", options: ["Common", "Uncommon", "Rare", "Epic", "Legendary"] },
    ],
  },
  RWA: {
    type: "RWA",
    label: "Real World Asset",
    description: "Tokenized physical assets: real estate, commodities, collectibles",
    icon: Building2,
    color: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    fields: [
      { key: "Asset Type",    label: "Asset Type",   inputType: "text" },
      { key: "Location",      label: "Location",     inputType: "text" },
      { key: "Valuation",     label: "Valuation",    inputType: "text",   placeholder: "$500,000" },
      { key: "Insurance",     label: "Insurance",    inputType: "text" },
    ],
  },
  Custom: {
    type: "Custom",
    label: "Custom",
    description: "Custom IP type — use standard attributes for any metadata",
    icon: Layers,
    color: { bg: "bg-muted/50", text: "text-muted-foreground", border: "border-border" },
    fields: [], // No predefined fields — free-form via standard attributes
  },
};

/**
 * All trait_type keys used by templates across all IP types, plus "IP Type" itself.
 * Used to filter template fields out of the Details and License tab attribute grids,
 * preventing duplication with the Media tab.
 */
export const TEMPLATE_TRAIT_TYPES = new Set<string>([
  "IP Type", // already shown as a badge in asset page header
  ...Object.values(IP_TEMPLATES).flatMap((t) => t.fields.map((f) => f.key)),
]);
