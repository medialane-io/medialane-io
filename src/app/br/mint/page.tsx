import type { Metadata } from "next";
import { Suspense } from "react";
import { BrMintContent } from "./br-mint-content";

const OG_IMAGE = "https://crimson-improved-unicorn-113.mypinata.cloud/ipfs/bafybeiglhfpl3ilyaiulzfjxspolmudih2d3t7lr27imy327fjag2s5zrq";

export const metadata: Metadata = {
  title: "Airdrop de Prêmios — Medialane Brasil",
  description:
    "Concorra a R$10 mil em prêmios criando sua conta grátis. Publique fotos, vídeos e músicas na Medialane — sem CPF, cartão ou taxas de gás.",
  openGraph: {
    title: "Airdrop de Prêmios — Medialane Brasil",
    description:
      "Concorra a R$10 mil em prêmios criando sua conta grátis. Publique fotos, vídeos e músicas na Medialane — sem CPF, cartão ou taxas de gás.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1024, height: 1024, alt: "Airdrop de Prêmios — Medialane Brasil" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Airdrop de Prêmios — Medialane Brasil",
    description:
      "Concorra a R$10 mil em prêmios criando sua conta grátis na Medialane.",
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
