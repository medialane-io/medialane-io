import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inter, Urbanist } from "next/font/google";
import { Providers } from "./providers";
import { JsonLd } from "@medialane/ui/json-ld";
import { APP_URL, defaultRobots } from "@/lib/seo";

import "@medialane/ui/styles";
import "./globals.css";
import { I18nProvider, LOCALES, msg, translate } from "@medialane/ui/i18n";
import { loadMessages } from "@/i18n/messages";

const inter = Inter({ subsets: ["latin"], display: "swap" });

const urbanist = Urbanist({ subsets: ["latin"], display: "swap", variable: "--font-display" });

const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Medialane — Creator Launchpad & NFT Marketplace",
    template: "%s | Medialane",
  },
  description:
    msg("Launch and collect NFTs."),
  keywords: ["NFT", "IP", "Launchpad", "Starknet", "Creator", "Marketplace"],
  authors: [{ name: "Medialane" }],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: defaultRobots,
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Medialane",
    description: msg("Creator launchpad & IP marketplace on Starknet"),
    siteName: "Medialane",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@medialane_io",
    images: ["/og-image.jpg"],
  },
};

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Medialane",
    url: APP_URL,
    logo: `${APP_URL}/medialane.png`,
    sameAs: [
      "https://x.com/medialane_io",
      "https://docs.medialane.io",
      "https://www.youtube.com/@MedialaneIO",
      "https://github.com/medialane-io",
      "https://www.instagram.com/medialane_io/",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Medialane",
    url: APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${APP_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
];

export const viewport = {
  themeColor: "black",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const messages = await loadMessages(locale);
  const t = (text: string) => translate({ messages, text });
  return {
    ...metadata,
    description: t(metadata.description as string),
    openGraph: {
      ...metadata.openGraph,
      locale: locale === "en" ? "en_US" : locale,
      description: t(metadata.openGraph?.description as string),
    },
  };
}

export function generateStaticParams() {
  return LOCALES.map(({ code }) => ({ locale: code }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const language = LOCALES.find(({ code }) => code === locale);
  if (!language) notFound();
  const messages = await loadMessages(locale);

  return (
    <html lang={locale} dir={language.dir} suppressHydrationWarning>
      <body className={`${inter.className} ${urbanist.variable}`}>
        <JsonLd data={siteJsonLd} />
        <I18nProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
