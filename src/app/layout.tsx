import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Urbanist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { ChipiProvider } from "@chipi-stack/nextjs";
import { Providers } from "./providers";
import { JsonLd } from "@/components/seo/json-ld";
import { APP_URL, defaultRobots } from "@/lib/seo";

import "@medialane/ui/styles";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });
// Brand display face — headings pick it up via --font-display (@medialane/ui styles).
const urbanist = Urbanist({ subsets: ["latin"], display: "swap", variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Medialane — Creator Launchpad & NFT Marketplace",
    template: "%s | Medialane",
  },
  description:
    "Launch, collect, and monetize your creative works. No seed phrases, no gas fees.",
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
    description: "Creator launchpad & IP marketplace on Starknet",
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
    sameAs: ["https://x.com/medialane_io", "https://docs.medialane.io"],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isBrLocale = pathname.startsWith("/br");

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
      // FALLBACK (not FORCE): only applies when a sign-up has no explicit
      // redirect. Campaign buttons (/br/mint, /mint, /airdrop) set their own
      // component-level forceRedirectUrl and MUST win — a global *force* here
      // overrides them and bounces ad sign-ups off the campaign route (the
      // af3bba6 regression). Do not change back to signUpForceRedirectUrl.
      signUpFallbackRedirectUrl="/onboarding"
      localization={isBrLocale ? ptBR : undefined}
    >
      <ChipiProvider>
        <html lang={isBrLocale ? "pt-BR" : "en"} suppressHydrationWarning>
          <body className={`${inter.className} ${urbanist.variable}`}>
            <JsonLd data={siteJsonLd} />
            <Providers>{children}</Providers>
          </body>
        </html>
      </ChipiProvider>
    </ClerkProvider>
  );
}
