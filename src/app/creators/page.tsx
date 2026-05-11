import type { Metadata } from "next";
import CreatorsPageClient from "./creators-client";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creators",
  description: "Meet the creators building on Medialane — discover artists, musicians, photographers, and developers minting IP onchain.",
  alternates: canonical("/creators"),
  openGraph: {
    title: "Creators | Medialane",
    description: "Meet the creators building on Medialane — discover artists, musicians, photographers, and developers minting IP onchain.",
    url: "/creators",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Medialane Creators" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creators | Medialane",
    description: "Meet the creators building on Medialane.",
    images: ["/og-image.jpg"],
  },
};

export default function CreatorsPage() {
  return <CreatorsPageClient />;
}
