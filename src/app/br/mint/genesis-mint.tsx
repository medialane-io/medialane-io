"use client";

import { Wallet } from "lucide-react";
import { GenesisMintCard, type GenesisMintCopy } from "@/components/genesis-mint-card";

const COPY: GenesisMintCopy = {
  preparing: "Preparando seu registro…",
  submitting: "Confirmando participação…",
  noAccount: "Conta não encontrada. Tente novamente.",
  notStarted: "Distribuição não iniciada ainda.",
  ready: "Conta ativa, minte seu passaporte",
  claim: "Garantir meu lugar",
  claimUnavailable: "Distribuição não iniciada",
  working: "Registrando sua participação…",
  wait: "Aguarde…",
  steps: ["Preparando seu registro", "Enviando", "Confirmado"],
  successTitle: "Você está dentro!",
  successBody: "Sua participação está confirmada.",
  create: "Publicar conteúdo",
  explore: "Explorar o app",
  again: "Não mintou seu passaporte? Tente novamente",
  failedTitle: "Não foi possível registrar",
  retry: "Tentar novamente",
};

const SIGNED_OUT = (
  <div className="space-y-3">
    <div className="flex items-center gap-3 py-2">
      <Wallet className="h-5 w-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Configure sua conta para participar.</p>
    </div>
  </div>
);

export function GenesisMint() {
  return <GenesisMintCard copy={COPY} storageKeyPrefix="ml_br_mint_" signedOut={SIGNED_OUT} />;
}
