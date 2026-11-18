import type { Metadata } from "next";
import { LOCALES, translate, withLocale, type LocaleInfo } from "@medialane/ui/i18n";
import { loadMessages } from "@/i18n/messages";

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://medialane.io").replace(/\/$/, "");

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${normalized}`;
}

export function alternates(path: string, locale: string, locales: readonly LocaleInfo[] = LOCALES): Metadata["alternates"] {
  const languages: Record<string, string> = { "x-default": absoluteUrl(path) };
  for (const { code } of locales) languages[code] = absoluteUrl(withLocale(path, code));
  return { canonical: absoluteUrl(withLocale(path, locale)), languages };
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

function socialImage(imageUrl?: string | null, alt = "Medialane") {
  const url = imageUrl || absoluteUrl("/og-image.jpg");
  return { url, width: 1200, height: 630, alt };
}

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

export function pageMetadata(page: {
  path: string;
  title: string;
  description?: string;
  imageAlt?: string;
  robots?: Metadata["robots"];
  social?: boolean;
}) {
  return async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
    const { locale } = await params;
    const messages = await loadMessages(locale);
    const t = (text?: string) => (text === undefined ? undefined : translate({ messages, text }));
    const title = t(page.title) as string;
    const description = t(page.description);
    const imageAlt = t(page.imageAlt);
    return {
      title,
      ...(description !== undefined && { description }),
      alternates: alternates(page.path, locale),
      ...(page.robots && { robots: page.robots }),
      ...(page.social === false ? {} : buildSocialMetadata({ title, description: description ?? "", imageAlt })),
    };
  };
}
