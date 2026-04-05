"use client";

import { useState, useCallback, useEffect } from "react";
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
  ImageIcon,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI, BR_NFT_IMAGE_URL } from "@/lib/constants";

// ─── Event image card ─────────────────────────────────────────────────────────

function EventCard({ claimed = false }: { claimed?: boolean }) {
  const [errored, setErrored] = useState(false);
  const src = BR_NFT_IMAGE_URL || "/genesis.jpg";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/30 via-primary/20 to-purple-500/30 blur-2xl scale-105 -z-10" />

      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {errored ? (
          // Placeholder when image fails
          <div className="w-full aspect-square bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-800 flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-primary/60" />
            </div>
            <p className="text-xs text-white/40 font-medium">Medialane Brasil 2026</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Brinde exclusivo do evento Medialane Brasil"
            className="w-full aspect-square object-cover"
            onError={() => setErrored(true)}
          />
        )}

        {/* Top badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-yellow-400/30">
          <Trophy className="h-3 w-3 text-yellow-400" />
          <span className="text-[11px] font-bold text-yellow-300">Airdrop de Prêmios</span>
        </div>

        {/* Claimed badge */}
        {claimed && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 border border-emerald-500/40">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span className="text-[11px] font-bold text-emerald-300">Participação confirmada</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Benefits ────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Trophy, label: "R$10 mil em prêmios", sub: "Sorteios e airdrop exclusivo" },
  { icon: Camera, label: "Publique e ganhe", sub: "Fotos, vídeos, músicas e mais" },
  { icon: Star,   label: "Acesso grátis",    sub: "Sem CPF, cartão ou aprovação" },
  { icon: Users,  label: "Só sua conta Google", sub: "Cadastro em menos de 1 minuto" },
];

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {BENEFITS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/5 p-3 backdrop-blur-sm"
        >
          <div className="mt-0.5 h-7 w-7 shrink-0 rounded-lg bg-primary/20 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight text-white">{label}</p>
            <p className="text-[11px] text-white/50 leading-snug mt-0.5">{sub}</p>
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
    // Force dark gradient background regardless of system theme
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">

      {/* Subtle radial gradient bg */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-white/8">
        <MedialaneLogo />
        <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1.5">
          <Trophy className="h-3 w-3 text-yellow-400" />
          <span className="text-[11px] font-bold text-yellow-300">Airdrop Brasil</span>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Panel — first on mobile, second on desktop */}
          <div className="space-y-5 order-1 lg:order-2">

            {/* Loading */}
            {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) && (
              <div className="space-y-4">
                <div className="h-10 w-48 rounded-lg bg-white/10 animate-pulse" />
                <div className="h-24 rounded-xl bg-white/8 animate-pulse" />
                <div className="h-12 rounded-xl bg-white/8 animate-pulse" />
              </div>
            )}

            {/* ── Not signed in ── */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                    Airdrop de{" "}
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      Prêmios
                    </span>
                  </h1>
                  <p className="text-sm text-white/60 leading-relaxed mt-3">
                    Publique fotos, vídeos e músicas e receba por isso. Concorra a{" "}
                    <strong className="text-white font-semibold">R$10 mil em prêmios</strong> — acesso completamente grátis.
                  </p>
                </div>

                <BenefitsGrid />

                <div className="space-y-2.5 pt-1">
                  <SignUpButton mode="modal" forceRedirectUrl="/onboarding?from=br">
                    <Button
                      size="lg"
                      className="w-full rounded-xl h-13 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/30 border-0 text-white"
                    >
                      <Sparkles className="h-4 w-4" />
                      Participar com minha conta Google
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl h-12 text-sm font-medium border-white/15 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                    >
                      Já tenho conta — entrar
                    </Button>
                  </SignInButton>
                </div>

                <p className="text-xs text-center text-white/30">
                  Não precisa de CPF, cartão ou aprovação de cadastro
                </p>
              </div>
            )}

            {/* ── Signed in, no wallet yet ── */}
            {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-medium">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black tracking-tight leading-[1.1]">
                    Proteja sua{" "}
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                      conta
                    </span>
                  </h2>
                  <p className="text-sm text-white/60 leading-relaxed mt-2">
                    Crie um código de segurança de 6 dígitos para ativar sua participação e proteger seus prêmios. Rápido e grátis.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/30 text-white border-0"
                  asChild
                >
                  <Link href="/onboarding?from=br">
                    Ativar minha conta
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <p className="text-xs text-center text-white/30">
                  Menos de 1 minuto · Sem taxa
                </p>
              </div>
            )}

            {/* ── Has wallet: claim flow ── */}
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
                      <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                        Garanta sua{" "}
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          participação
                        </span>
                      </h1>
                      <p className="text-sm text-white/60 leading-relaxed mt-3">
                        Receba seu brinde exclusivo e entre automaticamente no airdrop de prêmios.
                      </p>
                    </div>
                    <BenefitsGrid />
                    <div className="space-y-2 pt-1">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/30 text-white border-0 disabled:opacity-40"
                        onClick={() => setMintStep("enter-pin")}
                        disabled={!BR_MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {BR_MINT_CONTRACT ? "Garantir minha participação — Grátis" : "Distribuição abrindo em breve"}
                        {BR_MINT_CONTRACT && <ArrowRight className="h-4 w-4 ml-auto" />}
                      </Button>
                      <p className="text-xs text-center text-white/30">
                        Brinde exclusivo · Airdrop de prêmios · Gratuito
                      </p>
                    </div>
                  </>
                )}

                {/* Enter security code */}
                {mintStep === "enter-pin" && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
                    <div>
                      <p className="font-bold text-white">Confirme com seu código de segurança</p>
                      <p className="text-sm text-white/50 mt-1">
                        Digite o código de 6 dígitos criado ao ativar sua conta.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/5 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm border border-white/8">
                      <span className="text-white/40">Brinde</span>
                      <span className="font-medium text-white">Exclusivo Brasil</span>
                      <span className="text-white/40">Valor</span>
                      <span className="font-medium text-emerald-400">Grátis</span>
                      <span className="text-white/40">Taxas</span>
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
                        className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white border-0"
                        onClick={handleClaim}
                        disabled={mintPin.length < 6}
                      >
                        Confirmar
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-xl h-11 border-white/15 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                        onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Processing */}
                {mintStep === "minting" && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                    <div className="flex items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" />
                      <div>
                        <p className="font-bold text-white">Registrando sua participação…</p>
                        <p className="text-sm text-white/50 mt-0.5">
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
                        <div key={label} className="flex items-center gap-2 text-xs text-white/40">
                          {done
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            : <div className="h-3.5 w-3.5 rounded-full border border-white/20" />
                          }
                          <span className={done ? "text-white/80" : ""}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success */}
                {mintStep === "success" && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-5xl font-black tracking-tight leading-[1.05]">
                        Você está{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          dentro!
                        </span>
                      </h1>
                      <p className="text-sm text-white/50 mt-2">
                        Sua participação no airdrop está confirmada.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-300">Participação confirmada!</p>
                          <p className="text-xs text-white/40 mt-0.5">Elegível para o airdrop de R$10 mil.</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5">
                          <Trophy className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                          <span className="text-white/80">Elegível para R$10 mil em prêmios</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 px-3 py-2.5">
                          <Camera className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span className="text-white/80">Publique e aumente suas chances</span>
                        </div>
                      </div>

                      {completedTxHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors group"
                        >
                          <span className="font-mono">{completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Button
                        size="lg"
                        className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white border-0"
                        asChild
                      >
                        <Link href="/create/asset">Publicar meu primeiro conteúdo</Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="flex-1 border-white/15 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                        asChild
                      >
                        <Link href="/marketplace">Explorar o app</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Error */}
                {mintStep === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm text-white">Não foi possível registrar</p>
                          {(mintError || txError) && (
                            <p className="text-xs text-white/40 mt-1">{mintError || txError}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        onClick={handleRetry}
                      >
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

          {/* Image card — second on mobile, first on desktop */}
          <div className="flex justify-center order-2 lg:order-1">
            <div className="w-full max-w-sm">
              <EventCard claimed={mintStep === "success"} />
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-5 border-t border-white/8 flex items-center justify-center gap-5 text-xs text-white/25">
        <Link href="/terms" className="hover:text-white/60 transition-colors">Termos</Link>
        <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacidade</Link>
        <Link href="/about" className="hover:text-white/60 transition-colors">Sobre</Link>
        <span>© {new Date().getFullYear()} Medialane</span>
      </footer>
    </div>
  );
}
