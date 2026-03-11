import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ChipiProvider } from "@chipi-stack/nextjs";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://medialane.io"),
  title: {
    default: "Medialane — Creator Launchpad & IP Marketplace",
    template: "%s | Medialane",
  },
  description:
    "Launch, collect, and monetize intellectual property on Starknet. No seed phrases, no gas fees.",
  keywords: ["NFT", "IP", "Intellectual Property", "Starknet", "Creator", "Marketplace"],
  authors: [{ name: "Medialane" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Medialane",
    description: "Creator launchpad & IP marketplace on Starknet",
    siteName: "Medialane",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@medialane_io",
    images: ["/og-image.png"],
  },
};

export const viewport = {
  themeColor: "black",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
    >
      <ChipiProvider>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <Providers>{children}</Providers>
          </body>
        </html>
      </ChipiProvider>
    </ClerkProvider>
  );
}
