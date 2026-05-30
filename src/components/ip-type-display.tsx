"use client";

import type { IPType } from "@/types/ip";
import {
  IP_TEMPLATES,
  EMBED_PLATFORM_META,
  SOCIAL_PLATFORM_META,
  type EmbedPlatform,
} from "@/lib/ip-templates";
import { ExternalLink } from "lucide-react";

interface Attr {
  trait_type?: string | null;
  value?: string | null;
}

interface IPTypeDisplayProps {
  attributes: Attr[] | null | undefined;
}

// ── Embed URL parsers ────────────────────────────────────────────────────────

function parseYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.slice(1);
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

function parseSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    // Spotify's embed endpoint only accepts /embed/{type}/{id}. Isolate the
    // resource type + id so locale prefixes (e.g. /intl-pt) and trailing query
    // params don't leak through — `/embed/intl-pt/album/…` 404s on Spotify.
    const match = u.pathname.match(
      /(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/
    );
    if (!match) return null;
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  } catch {
    return null;
  }
}

function parseSoundCloudEmbed(url: string): string | null {
  try {
    new URL(url); // validate
    if (!url.includes("soundcloud.com")) return null;
    const encoded = encodeURIComponent(url);
    return `https://w.soundcloud.com/player/?url=${encoded}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`;
  } catch {
    return null;
  }
}

function parseTikTokEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("tiktok.com")) return null;
    const match = u.pathname.match(/\/video\/(\d+)/);
    if (!match) return null;
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  } catch {
    return null;
  }
}

function parseVimeoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("vimeo.com")) return null;
    const match = u.pathname.match(/(\d+)/);
    if (!match) return null;
    return `https://player.vimeo.com/video/${match[1]}`;
  } catch {
    return null;
  }
}

function getEmbedSrc(platform: EmbedPlatform, value: string): string | null {
  switch (platform) {
    case "youtube":    return parseYouTubeEmbed(value);
    case "spotify":    return parseSpotifyEmbed(value);
    case "soundcloud": return parseSoundCloudEmbed(value);
    case "tiktok":     return parseTikTokEmbed(value);
    case "vimeo":      return parseVimeoEmbed(value);
  }
}

// Compact iframe (fixed height) vs 16:9 video frame.
const COMPACT: Record<EmbedPlatform, boolean> = {
  spotify: true,
  soundcloud: true,
  youtube: false,
  tiktok: false,
  vimeo: false,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function IPTypeDisplay({ attributes }: IPTypeDisplayProps) {
  const attrs = attributes ?? [];

  const ipType = attrs.find(
    (a) => a.trait_type?.toLowerCase() === "ip type"
  )?.value as IPType | undefined;
  if (!ipType) return null;

  const template = IP_TEMPLATES[ipType];
  if (!template) return null;

  const getAttr = (key: string) =>
    attrs.find((a) => a.trait_type === key)?.value ?? null;

  const embeds = (template.embeds ?? []).flatMap((platform) => {
    const meta = EMBED_PLATFORM_META[platform];
    const value = getAttr(meta.traitKey);
    return value ? [{ platform, meta, value }] : [];
  });

  const socials = (template.socials ?? []).flatMap((platform) => {
    const meta = SOCIAL_PLATFORM_META[platform];
    const value = getAttr(meta.traitKey);
    return value ? [{ platform, meta, value }] : [];
  });

  if (embeds.length === 0 && socials.length === 0) return null;

  return (
    <div className="space-y-5">
      {embeds.map(({ platform, meta, value }) => {
        const src = getEmbedSrc(platform, value);
        if (src) {
          return (
            <div key={platform} className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {meta.label}
              </p>
              {COMPACT[platform] ? (
                <iframe
                  src={src}
                  className="w-full rounded-xl border-0"
                  height={166}
                  allow="autoplay"
                  loading="lazy"
                  title={meta.label}
                />
              ) : (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/20">
                  <iframe
                    src={src}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    title={meta.label}
                  />
                </div>
              )}
            </div>
          );
        }
        // Fallback: plain external link if URL parsing failed
        return (
          <div key={platform}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {meta.label}
            </p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open link
            </a>
          </div>
        );
      })}

      {socials.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Links
          </p>
          <div className="flex flex-wrap gap-2">
            {socials.map(({ platform, meta, value }) => {
              const SIcon = meta.icon;
              return (
                <a
                  key={platform}
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  <SIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
