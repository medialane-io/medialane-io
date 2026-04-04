"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { byteArray, CallData } from "starknet";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  ArrowRight,
  Trophy,
  Camera,
  Star,
  Users,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI, BR_NFT_IMAGE_URL } from "@/lib/constants";

// ─── Exclusive item card ──────────────────────────────────────────────────────

function EventCard({ claimed = false }: { claimed?: boolean }) {
  const imgSrc = BR_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/20 mx-auto">
      <Image
        src={imgSrc}
        alt="Brinde exclusivo do evento Medialane Brasil"
        width={480}
        height={480}
        className="w-full aspect-square object-cover"
        priority
      />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-white/10">
        <Trophy className="h-3 w-3 text-yellow-400" />
        <span className="text-[11px] font-bold text-white">Airdrop de Prêmios</span>
      </div>
      {claimed && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-emerald-500/40">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-bold text-emerald-400">Participação confirmada</span>
        </div>
      )}
    </div>
  );
}

// ─── Benefits ────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Trophy, label: "R$10 mil em prêmios", sub: "Sorteios e airdrop exclusivo" },
  { icon: Camera, label: "Publique e ganhe", sub: "Fotos, vídeos, músicas e mais" },
  { icon: Star, label: "Acesso grátis", sub: "Sem CPF, cartão ou aprovação" },
  { icon: Users, label: "Só sua conta Google", sub: "Cadastro em menos de 1 minuto" },
];

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {BENEFITS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3"
        >
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight">{label}</p>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function BrMintContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, error: txError, reset } = useChipiTransaction();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const userId = user?.id;
  const storageKey = userId ? `ml_br_mint_${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCompletedTxHash(stored);
      setMintStep("success");
    }
  }, [storageKey]);

  // ── Claim ─────────────────────────────────────────────────────────────────

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparando seu brinde…");

    try {
      if (!walletAddress) throw new Error("Conta não encontrada. Tente novamente.");
      if (!BR_MINT_CONTRACT) throw new Error("Distribuição não iniciada ainda.");

      let tokenUri = BR_NFT_URI;
      if (!tokenUri) {
        setMintStatusMsg("Registrando brinde…");
        const form = new FormData();
        form.append("name", "Medialane Brasil — Evento Exclusivo");
        form.append("description", "Brinde exclusivo do evento Medialane no Brasil. Passaporte para o airdrop de prêmios.");
        form.append("external_url", "https://medialane.io/br/mint");
        const res = await fetch("/api/pinata", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error("Falha ao registrar. Tente novamente.");
        tokenUri = data.uri;
      }

      setMintStatusMsg("Confirmando participação…");
      const encodedUri = byteArray.byteArrayFromString(tokenUri);
      const calldata = CallData.compile([walletAddress, encodedUri]);

      const result = await executeTransaction({
        pin: mintPin,
        contractAddress: BR_MINT_CONTRACT,
        calls: [{ contractAddress: BR_MINT_CONTRACT, entrypoint: "mint_item", calldata }],
      });

      if (result.status === "confirmed") {
        setMintStep("success");
        setCompletedTxHash(result.txHash);
        if (storageKey) localStorage.setItem(storageKey, result.txHash);
      } else {
        throw new Error("Não foi possível confirmar. Tente novamente.");
      }
    } catch (err: unknown) {
      setMintStep("error");
      setMintError(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
    }
  }, [mintPin, walletAddress, storageKey, executeTransaction]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setMintStep("ready");
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-border/40">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Medialane" className="h-7 w-7" />
          <span className="font-bold text-sm tracking-tight">Medialane</span>
        </Link>
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-3 py-1">
          <Trophy className="h-3 w-3 text-yellow-400" />
          <span className="text-[11px] font-semibold text-yellow-400">Airdrop Brasil</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* Image */}
          <div className="flex justify-center">
            <EventCard claimed={mintStep === "success"} />
          </div>

          {/* Panel */}
          <div className="space-y-5">

            {/* Loading */}
            {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) && (
              <div className="space-y-4">
                <div className="h-8 w-48 rounded-lg bg-muted/40 animate-pulse" />
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
              </div>
            )}

            {/* ── Not signed in ── */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                    Airdrop de{" "}
                    <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-primary bg-clip-text text-transparent">
                      Prêmios
                    </span>
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                    Publique fotos, vídeos e músicas e receba por isso. Concorra a <strong className="text-foreground">R$10 mil em prêmios</strong> — acesso completamente grátis.
                  </p>
                </div>

                <BenefitsGrid />

                <div className="space-y-2.5">
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding?from=br">
                    <Button
                      size="lg"
                      className="w-full rounded-xl h-13 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                    >
                      <Sparkles className="h-4 w-4" />
                      Participar com minha conta Google
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button size="lg" variant="outline" className="w-full rounded-xl h-12 text-sm font-medium">
                      Já tenho conta — entrar
                    </Button>
                  </SignInButton>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Não precisa de CPF, cartão ou aprovação de cadastro
                </p>
              </div>
            )}

            {/* ── Signed in, account not secured yet ── */}
            {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-medium">
                      Conta conectada — {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight leading-[1.1]">
                    Proteja sua{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      conta
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                    Crie um código de segurança de 6 dígitos para ativar sua participação no airdrop e proteger seus prêmios. Rápido e grátis.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                  asChild
                >
                  <Link href="/onboarding?from=br">
                    Ativar minha conta
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Menos de 1 minuto · Sem taxa
                </p>
              </div>
            )}

            {/* ── Account ready: claim flow ── */}
            {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && (
              <div className="space-y-5">

                {/* Ready */}
                {mintStep === "ready" && (
                  <>
                    <div>
                      <div className="flex items-center gap-2 text-sm mb-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-medium">Conta ativa</span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                        Garanta sua{" "}
                        <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-primary bg-clip-text text-transparent">
                          participação
                        </span>
                      </h1>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                        Receba seu brinde exclusivo do evento e entre automaticamente no airdrop de prêmios.
                      </p>
                    </div>
                    <BenefitsGrid />
                    <div className="space-y-2">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                        onClick={() => setMintStep("enter-pin")}
                        disabled={!BR_MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {BR_MINT_CONTRACT ? "Garantir minha participação — Grátis" : "Distribuição abrindo em breve"}
                        {BR_MINT_CONTRACT && <ArrowRight className="h-4 w-4 ml-auto" />}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Brinde exclusivo · Acesso ao airdrop · Gratuito
                      </p>
                    </div>
                  </>
                )}

                {/* Enter security code */}
                {mintStep === "enter-pin" && (
                  <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                    <div>
                      <p className="font-semibold">Confirme com seu código de segurança</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Digite o código de 6 dígitos que você criou ao ativar sua conta.
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Brinde</span>
                      <span className="font-medium">Exclusivo Brasil</span>
                      <span className="text-muted-foreground">Valor</span>
                      <span className="font-medium text-emerald-400">Grátis</span>
                      <span className="text-muted-foreground">Taxas</span>
                      <span className="font-medium text-emerald-400">Nenhuma</span>
                    </div>

                    <PinInput
                      value={mintPin}
                      onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                      placeholder="Seu código de segurança"
                      error={mintPinError}
                      autoFocus
                    />

                    <div className="flex gap-2">
                      <Button
                        size="lg"
                        className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                        onClick={handleClaim}
                        disabled={mintPin.length < 6}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-xl h-11"
                        onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Processing */}
                {mintStep === "minting" && (
                  <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" />
                      <div>
                        <p className="font-semibold">Registrando sua participação…</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {mintStatusMsg || "Aguarde um momento…"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {[
                        { label: "Preparando brinde exclusivo", done: status !== "idle" },
                        { label: "Registrando participação", done: status === "confirming" || status === "confirmed" },
                        { label: "Confirmando no sistema", done: status === "confirmed" },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                          {done
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          }
                          <span className={done ? "text-foreground" : ""}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success */}
                {mintStep === "success" && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">
                        Você está{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          dentro!
                        </span>
                      </h1>
                      <p className="text-sm text-muted-foreground mt-2">
                        Sua participação no airdrop está confirmada.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-300">Participação confirmada!</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Você está elegível para o airdrop de prêmios.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                          <span>Elegível para R$10 mil em prêmios</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Camera className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Publique conteúdo e aumente suas chances</span>
                        </div>
                      </div>

                      {completedTxHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                        >
                          <span className="font-mono">
                            {completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}
                          </span>
                          <ExternalLink className="h-3 w-3 group-hover:text-primary transition-colors" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Button size="lg" className="flex-1" asChild>
                        <Link href="/create/asset">Publicar meu primeiro conteúdo</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1" asChild>
                        <Link href="/marketplace">Explorar o app</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {mintStep === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Não foi possível registrar</p>
                          {(mintError || txError) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {mintError || txError}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Tentar novamente
                      </Button>
                    </div>
                    <BenefitsGrid />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border/40 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground transition-colors">Termos</Link>
        <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
        <Link href="/about" className="hover:text-foreground transition-colors">Sobre</Link>
        <span>© {new Date().getFullYear()} Medialane</span>
      </footer>
    </div>
  );
}
