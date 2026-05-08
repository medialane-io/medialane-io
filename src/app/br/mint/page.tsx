import type { Metadata } from "next";
import { Suspense } from "react";
import { BrMintContent } from "./br-mint-content";

const OG_IMAGE = "https://crimson-improved-unicorn-113.mypinata.cloud/ipfs/bafybeiglhfpl3ilyaiulzfjxspolmudih2d3t7lr27imy327fjag2s5zrq";

export const metadata: Metadata = {
  title: "Medialane - Campanha de Lançamento no Brasil",
  description:
    "Campanha de Lançamento no Brasil. Publique fotos, vídeos, músicas, e conteúdo autoral para monetizar com Medialane.",
  openGraph: {
    title: "Medialane - Campanha de Lançamento no Brasil",
    description:
      "Campanha de Lançamento no Brasil. Publique fotos, vídeos, músicas, e conteúdo autoral para monetizar com Medialane.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: "Airdrop de Prêmios — Medialane Brasil" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Medialane - Campanha de Lançamento no Brasil",
    description:
      "Campanha de Lançamento no Brasil. Publique fotos, vídeos, músicas, e conteúdo autoral para monetizar com Medialane.",
    images: [OG_IMAGE],
  },
};

export default function BrMintPage() {
  return (
    <Suspense>
      <BrMintContent />
    </Suspense>
  );
}
