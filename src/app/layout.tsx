export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
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
  },
  twitter: {
    card: "summary_large_image",
    creator: "@medialane_io",
  },
};

export const viewport = {
  themeColor: "black",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      afterSignOutUrl="/"
    >
      <Providers>
        <html lang="en" suppressHydrationWarning>
          <body className={inter.className}>
            <div className="relative min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
          </body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}
