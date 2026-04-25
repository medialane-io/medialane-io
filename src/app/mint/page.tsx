import type { Metadata } from "next";
import { Suspense } from "react";
import { MintContent } from "./mint-content";

const OG_IMAGE = "https://crimson-improved-unicorn-113.mypinata.cloud/ipfs/bafybeiglhfpl3ilyaiulzfjxspolmudih2d3t7lr27imy327fjag2s5zrq";

export const metadata: Metadata = {
  title: "Prize Airdrop — Medialane",
  description:
    "Win prizes by creating your free account. Publish photos, videos, and music on Medialane — no gas fees, no approval required.",
  openGraph: {
    title: "Prize Airdrop — Medialane",
    description:
      "Win prizes by creating your free account. Publish photos, videos, and music on Medialane — no gas fees, no approval required.",
    locale: "en_US",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: "Prize Airdrop — Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prize Airdrop — Medialane",
    description: "Win prizes by creating your free account on Medialane.",
    images: [OG_IMAGE],
  },
};

export default function MintPage() {
  return (
    <Suspense>
      <MintContent />
    </Suspense>
  );
}
