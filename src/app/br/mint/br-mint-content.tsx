"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { byteArray, CallData } from "starknet";
import {
  Sparkles,
  Zap,
  Shield,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  Gift,
  Droplets,
  ArrowRight,
  Wallet,
  User,
  MapPin,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI, BR_NFT_IMAGE_URL } from "@/lib/constants";

// ─── NFT preview card ─────────────────────────────────────────────────────────

function NftCard({ minted = false }: { minted?: boolean }) {
  const imgSrc = BR_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative w-72 sm:w-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/30">
      <Image
        src={imgSrc}
        alt="NFT Exclusivo Brasil — Medialane"
        width={400}
        height={400}
        className="w-full aspect-square object-cover"
        priority
      />
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-white/10">
        <MapPin className="h-3 w-3 text-emerald-400" />
        <span className="text-[11px] font-semibold text-white">Evento Brasil</span>
      </div>
      {minted && (
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-1 border border-emerald-500/40">
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400">Mintado</span>
        </div>
      )}
    </div>
  );
}

// ─── Benefits grid ────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: Gift, label: "Gratuito", sub: "Sem taxas de protocolo" },
  { icon: Zap, label: "Sem gas", sub: "Patrocinado pela ChipiPay" },
  { icon: Droplets, label: "Passaporte airdrop", sub: "Distribuições futuras" },
  { icon: Shield, label: "IP programável", sub: "Propriedade imutável" },
];

function BenefitsGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {BENEFITS.map(({ icon: Icon, label, sub }) => (
        <div
          key={label}
          className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 hover:border-primary/30 transition-colors"
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

// ─── Steps indicator ──────────────────────────────────────────────────────────

function StepsIndicator({ current }: { current: 0 | 1 | 2 }) {
  const steps = ["Criar conta", "Carteira invisível", "Mintar NFT"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-primary text-white"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap ${
                  active ? "text-foreground" : done ? "text-emerald-400" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-4 shrink-0 ${i < current ? "bg-emerald-500" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function BrMintContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, statusMessage, error: txError, reset } = useChipiTransaction();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);

  const userId = user?.id;
  const storageKey = userId ? `ml_br_mint_${userId}` : null;

  // Restore minted state
  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setCompletedTxHash(stored);
      setMintStep("success");
    }
  }, [storageKey]);

  // ── Mint ──────────────────────────────────────────────────────────────────

  const handleMint = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparando seu NFT…");

    try {
      if (!walletAddress) throw new Error("Endereço da carteira não encontrado.");
      if (!BR_MINT_CONTRACT) throw new Error("Contrato de mint não configurado.");

      let tokenUri = BR_NFT_URI;
      if (!tokenUri) {
        setMintStatusMsg("Enviando metadados do NFT…");
        const form = new FormData();
        form.append("name", "Medialane Brasil");
        form.append("description", "NFT exclusivo do evento Medialane no Brasil.");
        form.append("external_url", "https://medialane.io/br/mint");
        const res = await fetch("/api/pinata", { method: "POST", body: form });
        const data = await res.json();
        if (data.error) throw new Error("Falha no upload dos metadados: " + data.error);
        tokenUri = data.uri;
      }

      setMintStatusMsg("Enviando transação…");
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
        throw new Error(result.revertReason || "Transação revertida na blockchain.");
      }
    } catch (err: unknown) {
      setMintStep("error");
      setMintError(err instanceof Error ? err.message : "Falha no mint. Tente novamente.");
    }
  }, [mintPin, walletAddress, storageKey, executeTransaction]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setMintStep("ready");
  };

  // ── Layout wrapper ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/40">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="Medialane" className="h-7 w-7" />
          <span className="font-bold text-sm tracking-tight">Medialane</span>
        </Link>
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-3 py-1">
          <MapPin className="h-3 w-3 text-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-400">Brasil</span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: NFT card */}
          <div className="flex justify-center">
            <NftCard minted={mintStep === "success"} />
          </div>

          {/* Right: interactive panel */}
          <div className="space-y-5">

            {/* ── Loading ── */}
            {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) && (
              <div className="space-y-4">
                <div className="h-8 w-40 rounded-lg bg-muted/40 animate-pulse" />
                <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />
                <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
              </div>
            )}

            {/* ── Not signed in ── */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-5">
                <div>
                  <StepsIndicator current={0} />
                </div>

                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                    Seu NFT{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      exclusivo
                    </span>
                    {" "}do Brasil
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Você foi convidado para o evento Medialane no Brasil. Cadastre-se e receba seu NFT comemorativo — completamente grátis, sem taxas de gás.
                  </p>
                </div>

                <BenefitsGrid />

                <div className="space-y-2.5">
                  <SignUpButton
                    mode="modal"
                    forceRedirectUrl="/onboarding?from=br"
                  >
                    <Button
                      size="lg"
                      className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                    >
                      <Sparkles className="h-4 w-4" />
                      Criar conta com Google
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full rounded-xl h-12 text-base font-medium"
                    >
                      <User className="h-4 w-4" />
                      Já tenho conta
                    </Button>
                  </SignInButton>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Sem seed phrase · Sem taxas · Starknet Mainnet
                </p>
              </div>
            )}

            {/* ── Signed in, no wallet: send to onboarding ── */}
            {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && (
              <div className="space-y-5">
                <StepsIndicator current={1} />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-medium">
                      Conta criada — {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight leading-[1.1]">
                    Configure sua{" "}
                    <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      carteira
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Um passo rápido antes de mintar — configure sua carteira invisível com passkey ou PIN. Sem seed phrases, sem taxas de gás.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                  asChild
                >
                  <Link href="/onboarding?from=br">
                    <Wallet className="h-4 w-4" />
                    Configurar minha carteira
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Menos de 1 minuto · Passkey ou PIN
                </p>
              </div>
            )}

            {/* ── Has wallet: mint flow ── */}
            {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && (
              <div className="space-y-5">

                {mintStep !== "success" && (
                  <div className="space-y-1">
                    <StepsIndicator current={2} />
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1] pt-2">
                      Mintar seu{" "}
                      <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        NFT exclusivo
                      </span>
                    </h1>
                  </div>
                )}

                {/* ── Ready ── */}
                {mintStep === "ready" && (
                  <>
                    <BenefitsGrid />
                    <div className="space-y-3">
                      <Button
                        size="lg"
                        className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                        onClick={() => setMintStep("enter-pin")}
                        disabled={!BR_MINT_CONTRACT}
                      >
                        <Sparkles className="h-4 w-4" />
                        {BR_MINT_CONTRACT ? "Mintar agora — Grátis" : "Em breve"}
                        <ArrowRight className="h-4 w-4 ml-auto" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Edição limitada · Evento Brasil · Gas patrocinado
                      </p>
                    </div>
                  </>
                )}

                {/* ── Enter PIN ── */}
                {mintStep === "enter-pin" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                      <div>
                        <p className="font-semibold mb-1">Confirme com o PIN da sua carteira</p>
                        <p className="text-sm text-muted-foreground">
                          Digite o PIN criado ao configurar sua carteira. Isso autoriza o mint gratuito.
                        </p>
                      </div>

                      {/* Transaction summary */}
                      <div className="rounded-lg bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">NFT</span>
                        <span className="font-medium">Medialane Brasil</span>
                        <span className="text-muted-foreground">Preço</span>
                        <span className="font-medium text-emerald-400">Gratuito</span>
                        <span className="text-muted-foreground">Gas</span>
                        <span className="font-medium text-emerald-400">Patrocinado</span>
                        <span className="text-muted-foreground">Rede</span>
                        <span className="font-medium">Starknet</span>
                      </div>

                      <PinInput
                        value={mintPin}
                        onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                        placeholder="PIN da sua carteira"
                        error={mintPinError}
                        autoFocus
                      />

                      <div className="flex gap-2">
                        <Button
                          size="lg"
                          className="flex-1 rounded-xl h-11 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
                          onClick={handleMint}
                          disabled={mintPin.length < 6}
                        >
                          <Sparkles className="h-4 w-4" />
                          Mintar
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
                  </div>
                )}

                {/* ── Minting ── */}
                {mintStep === "minting" && (
                  <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Mintando seu NFT do Brasil…</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {mintStatusMsg || statusMessage || "Aguarde…"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      {[
                        { label: "Enviar metadados", done: status !== "idle" },
                        { label: "Enviar transação", done: status === "confirming" || status === "confirmed" },
                        { label: "Confirmar no Starknet", done: status === "confirmed" },
                      ].map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                          {done ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />
                          )}
                          <span className={done ? "text-foreground" : ""}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Success ── */}
                {mintStep === "success" && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <StepsIndicator current={3 as never} />
                      <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] pt-2">
                        Bem-vindo{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                          ao Medialane!
                        </span>
                      </h1>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-300 text-lg">NFT mintado!</p>
                          <p className="text-sm text-muted-foreground">
                            Você faz parte da comunidade Medialane.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Droplets className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Passaporte para airdrops futuros</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
                          <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Propriedade imutável na blockchain</span>
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
                        <Link href="/marketplace">Explorar marketplace</Link>
                      </Button>
                      <Button size="lg" variant="outline" className="flex-1" asChild>
                        <Link href="/create/asset">Criar seu primeiro ativo</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* ── Error ── */}
                {mintStep === "error" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm">Mint falhou</p>
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
        <span>© {new Date().getFullYear()} Medialane DAO</span>
      </footer>
    </div>
  );
}
