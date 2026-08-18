import type { Metadata } from "next";
import { Suspense } from "react";
import { BrMintContent } from "./br-mint-content";
import { absoluteUrl, AIRDROP_OG_IMAGE as OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Medialane - Campanha de Lançamento no Brasil",
  description:
    "Campanha de Lançamento no Brasil. Publique fotos, vídeos, músicas, e conteúdo autoral para monetizar com Medialane.",
  alternates: {
    canonical: absoluteUrl("/br/mint"),
    languages: {
      "en-US": absoluteUrl("/mint"),
      "pt-BR": absoluteUrl("/br/mint"),
    },
  },
  openGraph: {
    title: "Medialane - Campanha de Lançamento no Brasil",
    description:
      "Campanha de Lançamento no Brasil. Publique fotos, vídeos, músicas, e conteúdo autoral para monetizar com Medialane.",
    locale: "pt_BR",
    type: "website",
    url: "/br/mint",
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
