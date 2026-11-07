"use client";

import { MintLanding, type MintLandingCopy } from "@medialane/ui";
import { GenesisMint } from "./genesis-mint";

export const BR_MINT_COPY: MintLandingCopy = {
  image: { src: "/br_launch.jpg", alt: "Medialane Airdrop de Prêmios", fallback: "Medialane Brasil 2026" },
  headline: { lead: "Participe do", highlight: "Airdrop" },
  chips: ["Grátis", "Sem cartão", "Sem CPF"],
  learnMore: "Saiba mais sobre a campanha",
  fund: {
    title: "Fundo para Criadores",
    cards: [
      { title: "Participação grátis", body: "Faça login com sua conta Google" },
      { title: "Fundo de criadores", body: "Distribuição de fundos para todos os participantes." },
      { title: "Aumente suas chances", body: "Crie, compartilhe e colecione!" },
    ],
  },
  how: {
    eyebrow: "Como funciona",
    title: "Participe em poucos segundos.",
    account: {
      title: "Acesso com Google",
      tag: "Mínimo — você está dentro",
      body: "Faça login com Google e defina um PIN ou passkey para proteger sua conta.",
    },
    create: {
      tag: "Bônus",
      title: "Crie conteúdo",
      body: "Publique fotos, músicas, arte ou textos. Criadores recebem uma fatia maior.",
    },
    trade: { tag: "Maior bônus", title: "Compre e colecione", body: "Participantes ativos recebem a maior fatia." },
  },
  phases: {
    eyebrow: "Distribuição",
    title: "Fases do fundo",
    first: {
      title: "Fase 1",
      tag: "5.000 membros",
      body: "Primeira distribuição. Participantes elegíveis recebem uma parte proporcional à sua atividade.",
    },
    second: {
      title: "Fase 2",
      tag: "10.000 membros",
      body: "Segunda distribuição, incluindo toda a receita acumulada desde a Fase 1.",
    },
    note: "As Fases são objetivos da comunidade, não garantias.",
  },
  eligibility: {
    eyebrow: "Elegibilidade",
    title: "Quem é elegível",
    items: [
      { ok: true, text: "Qualquer pessoa que criar uma conta gratuita." },
      { ok: true, text: "Quem publica conteúdo original recebe uma fatia maior." },
      { ok: true, text: "Quem negocia ou colabora recebe a maior fatia." },
      { ok: false, text: "Ferramentas automatizadas e cadastros duplicados são desqualificados." },
      { ok: false, text: "Inflar pontuações artificialmente é desqualificado." },
    ],
  },
  disclaimer: {
    title: "Aviso legal",
    paragraphs: [
      "A Medialane é uma plataforma para criação e monetização de conteúdo autoral. Esta campanha não é um produto financeiro, esquema de investimento, loteria ou serviço de apostas.",
      "A participação não garante nenhum retorno financeiro. As distribuições podem tomar a forma de créditos, ativos digitais ou outros recursos.",
    ],
    agree: { lead: "Ao participar, você concorda com o", campaignTerms: "Regulamento", and: "e os", terms: "Termos de Uso" },
  },
  footer: {
    line: "Participação gratuita · Sem necessidade de compra ·",
    campaignTerms: "Ver regulamento",
    links: { terms: "Termos", privacy: "Privacidade", campaign: "Campanha", about: "Sobre" },
  },
};

export function BrMintContent() {
  return <MintLanding copy={BR_MINT_COPY} mint={<GenesisMint />} />;
}
