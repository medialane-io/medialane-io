import type { Metadata } from "next";
import { Suspense } from "react";
import { MintContent } from "./mint-content";
import { canonical, buildSocialMetadata, AIRDROP_OG_IMAGE } from "@/lib/seo";

const title = "Creator's Airdrop";
const description =
  "Claim your participation record and join the Medialane Creator's Airdrop. Free for everyone — no approval, no fees. Eligible for every community fund distribution.";

export const metadata: Metadata = {
  title,
  description,
  alternates: canonical("/mint"),
  ...buildSocialMetadata({
    title,
    description,
    imageUrl: AIRDROP_OG_IMAGE,
    imageSize: { width: 1024, height: 1024 },
  }),
};

export default function MintPage() {
  return (
    <Suspense>
      <MintContent />
    </Suspense>
  );
}
