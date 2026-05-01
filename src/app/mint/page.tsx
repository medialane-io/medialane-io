import type { Metadata } from "next";
import { Suspense } from "react";
import { MintContent } from "./mint-content";

const OG_IMAGE = "https://crimson-improved-unicorn-113.mypinata.cloud/ipfs/bafybeiglhfpl3ilyaiulzfjxspolmudih2d3t7lr27imy327fjag2s5zrq";

export const metadata: Metadata = {
  title: "Creator's Airdrop — Medialane",
  description:
    "Claim your participation record and join the Medialane Creator's Airdrop. Free for everyone — no approval, no fees. Eligible for every community fund distribution.",
  openGraph: {
    title: "Creator's Airdrop — Medialane",
    description:
      "Claim your participation record and join the Medialane Creator's Airdrop. Free for everyone — no approval, no fees.",
    locale: "en_US",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: "Creator's Airdrop — Medialane" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator's Airdrop — Medialane",
    description: "Claim your free participation record in the Medialane creator community fund.",
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
