import type { Metadata } from "next";

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://medialane.io").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${normalized}`;
}

export function canonical(path = "/"): Metadata["alternates"] {
  return { canonical: absoluteUrl(path) };
}

export const defaultRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export function truncateDescription(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Always returns a usable share image — falls back to the site default
 * (/og-image.jpg) when a page has no content image of its own. Next.js does
 * NOT deep-merge `openGraph`/`twitter` from the root layout into a page that
 * defines its own — a page whose content image failed to resolve (or that
 * never set one) previously shipped with NO og:image at all, which several
 * platforms (Discord, Telegram, Slack) render as a bare link with no card.
 */
export function socialImage(imageUrl?: string | null, alt = "Medialane") {
  const url = imageUrl || absoluteUrl("/og-image.jpg");
  return { url, width: 1200, height: 630, alt };
}

/**
 * Builds a complete, guaranteed-image `openGraph` + `twitter` pair for a page.
 * `title` should be the bare page title (no " | Medialane" suffix) — the
 * suffix is only applied here, since OG/Twitter tags don't get the root
 * layout's title template applied to them.
 */
export function buildSocialMetadata(opts: {
  title: string;
  description: string;
  imageUrl?: string | null;
  imageAlt?: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const ogTitle = `${opts.title} | Medialane`;
  const image = socialImage(opts.imageUrl, opts.imageAlt ?? opts.title);

  return {
    openGraph: {
      type: "website",
      title: ogTitle,
      description: opts.description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: opts.description,
      images: [image.url],
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/** JSON-LD BreadcrumbList for a page's position in the site hierarchy. */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** JSON-LD Product for a fungible/tradeable asset detail page (e.g. a coin). */
export function buildProductJsonLd(opts: {
  name: string;
  path: string;
  description?: string;
  image?: string;
  sku?: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    url: absoluteUrl(opts.path),
    ...(opts.description && { description: opts.description }),
    ...(opts.image && { image: [opts.image] }),
    ...(opts.sku && { sku: opts.sku }),
    ...(opts.brand && { brand: { "@type": "Brand", name: opts.brand } }),
  };
}
