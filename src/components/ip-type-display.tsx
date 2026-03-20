"use client";

import type { IPType } from "@/types/ip";
import { IP_TEMPLATES, type EmbedType } from "@/lib/ip-templates";
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
    // /track/id → /embed/track/id
    const path = u.pathname.replace(/^\//, "embed/");
    return `https://open.spotify.com/${path}`;
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

function getEmbedSrc(embedType: EmbedType, value: string): string | null {
  switch (embedType) {
    case "youtube":    return parseYouTubeEmbed(value);
    case "spotify":    return parseSpotifyEmbed(value);
    case "soundcloud": return parseSoundCloudEmbed(value);
    case "tiktok":     return parseTikTokEmbed(value);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IPTypeDisplay({ attributes }: IPTypeDisplayProps) {
  const attrs = attributes ?? [];

  // Find ipType from attributes
  const ipType = attrs.find(
    (a) => a.trait_type?.toLowerCase() === "ip type"
  )?.value as IPType | undefined;

  if (!ipType) return null;

  const template = IP_TEMPLATES[ipType];
  if (!template || template.fields.length === 0) return null;

  // Map template fields to attribute values
  const fieldValues = template.fields.map((field) => {
    const attr = attrs.find((a) => a.trait_type === field.key);
    return { field, value: attr?.value ?? null };
  }).filter(({ value }) => value !== null && value !== "");

  if (fieldValues.length === 0) return null;

  // Separate embed fields from plain metadata fields
  const embedFields = fieldValues.filter(({ field }) => field.embed);
  const metaFields  = fieldValues.filter(({ field }) => !field.embed);

  return (
    <div className="space-y-5">
      {/* Embed block — rendered first if any embed URL exists */}
      {embedFields.map(({ field, value }) => {
        if (!field.embed || !value) return null;
        const src = getEmbedSrc(field.embed, value);
        if (src) {
          return (
            <div key={field.key} className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {field.label}
              </p>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/20">
                <iframe
                  src={src}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title={field.label}
                />
              </div>
            </div>
          );
        }
        // Fallback: plain external link if URL parsing failed
        return (
          <div key={field.key}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {field.label}
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

      {/* Metadata rows */}
      {metaFields.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {template.label} Metadata
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {metaFields.map(({ field, value }) => (
              <div
                key={field.key}
                className="rounded-lg border border-border bg-muted/20 p-3 text-center overflow-hidden"
              >
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                  {field.label}
                </p>
                <p className="text-sm font-semibold mt-0.5 truncate" title={value ?? ""}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
