import type { Metadata } from "next";
import { Suspense } from "react";
import { BrMintContent } from "./br-mint-content";

export const metadata: Metadata = {
  title: "NFT Exclusivo Brasil — Medialane",
  description:
    "Você foi convidado para o evento Medialane no Brasil. Cadastre-se e receba seu NFT exclusivo — gratuito, sem taxas de gás.",
  openGraph: {
    title: "NFT Exclusivo Brasil — Medialane",
    description:
      "Cadastre-se na Medialane e receba seu NFT exclusivo do evento. Gratuito e sem taxas de gás.",
    locale: "pt_BR",
  },
};

export default function BrMintPage() {
  return (
    <Suspense>
      <BrMintContent />
    </Suspense>
  );
}
