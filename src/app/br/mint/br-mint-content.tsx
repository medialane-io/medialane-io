"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
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
  ImageIcon,
  Gift,
  Coins,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  FileCheck,
  Zap,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI, BR_NFT_IMAGE_URL } from "@/lib/constants";
import { completeOnboarding } from "@/app/onboarding/_actions";

// ─── Event image card ─────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = BR_NFT_IMAGE_URL || "/genesis.jpg";

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-border/40 shadow-2xl shadow-black/20 ring-1 ring-white/5">
        {errored ? (
          <div className="w-full aspect-square bg-muted/30 flex flex-col items-center justify-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-primary/40" />
            </div>
            <p className="text-xs text-muted-foreground font-medium">Medialane Brasil 2026</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Medialane Airdrop de Prêmios"
            className="w-full aspect-square object-cover"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Below-fold sections (exibidas apenas quando não autenticado) ─────────────

const O_QUE_VOCE_GANHA = [
  {
    icon: FileCheck,
    title: "Registro de participação",
    desc: "Um comprovante permanente e verificável do seu lugar no airdrop da Medialane — seguro em uma rede pública e seu para sempre.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Coins,
    title: "Acesso ao fundo",
    desc: "Elegível automaticamente para todas as distribuições — Fase 1 com 5 mil participantes, Fase 2 com 10 mil e todo ciclo anual seguinte.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    icon: Camera,
    title: "Plataforma de criadores",
    desc: "Publique fotos, vídeos, músicas e documentos. Construa uma audiência, ganhe com o seu trabalho e conecte-se com o mundo.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
];

const COMO_FUNCIONA = [
  {
    step: "1",
    title: "Crie sua conta",
    desc: "Cadastre-se com sua conta Google em segundos. Sem aprovação, sem CPF e sem cartão de crédito.",
  },
  {
    step: "2",
    title: "Proteja sua conta",
    desc: "Adicione um PIN de 6 dígitos ou biometria (Face ID / impressão digital) para proteger sua participação.",
  },
  {
    step: "3",
    title: "Reivindique seu registro",
    desc: "Confirme sua participação no airdrop com um toque. Seu lugar no fundo é permanente.",
  },
];

const FASES_DO_FUNDO = [
  {
    phase: "Fase 1",
    trigger: "5.000 participantes",
    desc: "Primeira distribuição do fundo de criadores. Todos os participantes elegíveis recebem sua parte proporcional.",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "text-blue-400",
  },
  {
    phase: "Fase 2",
    trigger: "10.000 participantes",
    desc: "Segunda distribuição, incluindo toda a receita acumulada desde a Fase 1. A comunidade vota no valor a distribuir.",
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "text-purple-400",
  },
];

function OQueVoceGanha() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">O que está incluído</p>
        <h2 className="text-2xl font-black">Tudo o que você recebe, grátis</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {O_QUE_VOCE_GANHA.map(({ icon: Icon, title, desc, color, bg }) => (
          <div key={title} className="rounded-2xl border border-border/40 bg-muted/10 p-6 space-y-3 hover:bg-muted/20 transition-colors">
            <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComoFunciona() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">Processo simples</p>
        <h2 className="text-2xl font-black">Como funciona</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {COMO_FUNCIONA.map(({ step, title, desc }) => (
          <div key={step} className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <span className="text-lg font-black text-primary">{step}</span>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FasesDoFundo() {
  return (
    <div className="py-14 border-t border-border/30">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">Cronograma de distribuição</p>
        <h2 className="text-2xl font-black">O fundo de prêmios</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          A receita da plataforma vai inteiramente para a comunidade. Sem investidores levando uma parte.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {FASES_DO_FUNDO.map(({ phase, trigger, desc, color, badge }) => (
          <div key={phase} className={`rounded-2xl border p-6 space-y-2 ${color}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-bold text-sm">{phase}</p>
              <span className={`text-xs font-semibold ${badge}`}>{trigger}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/40 bg-muted/10 p-5 flex items-start gap-4">
        <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-sm">Ciclo anual — para sempre</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Todo ano a comunidade Medialane vota como distribuir a receita daquele ano. O fundo se repete indefinidamente — a Medialane não tem investidores extraindo receita.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Configuração de conta ────────────────────────────────────────────────────

type WalletSetupStep = "choose" | "pin" | "passkey" | "creating" | "done";

function WalletSetup({ email, onDone }: { email?: string | null; onDone: () => void }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet } = useChipiWallet({
    externalUserId: user?.id ?? null,
    getBearerToken,
    enabled: false,
  });

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [step, setStep] = useState<WalletSetupStep>(passkeySupported ? "choose" : "pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createWalletWithKey = async (encryptKey: string) => {
    const wallet = await createWallet({ encryptKey });
    const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
    if (!walletKey) throw new Error("Erro ao ativar conta. Tente novamente.");
    const result = await completeOnboarding({ publicKey: walletKey });
    if (result.error) throw new Error(result.error);
    await user?.reload();
    await session?.touch();
    setStep("done");
    setTimeout(onDone, 1200);
  };

  const handlePasskey = async () => {
    setIsSubmitting(true);
    setError(null);
    setStep("passkey");
    try {
      const userName = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "user";
      const { encryptKey } = await createWalletPasskey(user?.id ?? "", userName);
      setStep("creating");
      await createWalletWithKey(encryptKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro na configuração. Tente o código PIN.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setIsSubmitting(true);
    setError(null);
    setStep("creating");
    try {
      await createWalletWithKey(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao ativar conta. Tente novamente.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "creating" || step === "passkey") {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-6 flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <p className="font-bold">Ativando sua conta…</p>
          <p className="text-sm text-muted-foreground mt-1">Estamos preparando tudo para você.</p>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <div>
          <p className="font-bold text-emerald-600 dark:text-emerald-300">Conta ativada!</p>
          <p className="text-sm text-muted-foreground mt-1">Preparando sua participação…</p>
        </div>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        {email && (
          <div className="flex items-center gap-2 text-sm mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{email}</span>
          </div>
        )}
        <h2 className="text-3xl font-black tracking-tight leading-[1.1]">
          Proteja sua{" "}
          <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            conta
          </span>
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          {step === "pin"
            ? "Crie um código de segurança de 6 dígitos. Você vai usá-lo para confirmar sua participação."
            : "Adicione biometria ou PIN para proteger sua participação no airdrop."}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {step === "choose" && passkeySupported && (
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
            onClick={handlePasskey}
            disabled={isSubmitting}
          >
            <ShieldCheck className="h-4 w-4" />
            Usar biometria (Face ID / digital)
          </Button>
          <Button
            size="lg"
            className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
            onClick={() => setStep("pin")}
            disabled={isSubmitting}
          >
            <KeyRound className="h-4 w-4" />
            Criar código PIN (6 dígitos)
          </Button>
        </div>
      )}

      {step === "choose" && !passkeySupported && (
        <Button
          size="lg"
          className="w-full rounded-xl h-12 font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
          onClick={() => setStep("pin")}
          disabled={isSubmitting}
        >
          <KeyRound className="h-4 w-4" />
          Criar código PIN (6 dígitos)
        </Button>
      )}

      {step === "pin" && (
        <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <p className="font-semibold text-sm">Crie seu código de segurança</p>
          </div>
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setPinError(null); }}
            error={pinError}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1 rounded-xl h-11 font-bold bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90"
              onClick={handlePin}
              disabled={pin.length < 6 || isSubmitting}
            >
              Ativar minha conta
            </Button>
            {passkeySupported && (
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-11"
                onClick={() => { setStep("choose"); setPin(""); setPinError(null); setError(null); }}
              >
                Voltar
              </Button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-center text-muted-foreground">
        Seu PIN ou passkey protege sua conta e não será compartilhado.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
  const [walletJustCreated, setWalletJustCreated] = useState(false);

  const userId = user?.id;
  const storageKey = userId ? `ml_br_mint_${userId}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const stored = localStorage.getItem(storageKey);
    if (stored) { setCompletedTxHash(stored); setMintStep("success"); }
  }, [storageKey]);

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setMintError(null);
    setMintStep("minting");
    setMintStatusMsg("Preparando seu registro…");

    try {
      if (!walletAddress) throw new Error("Conta não encontrada. Tente novamente.");
      if (!BR_MINT_CONTRACT) throw new Error("Distribuição não iniciada ainda.");

      let tokenUri = BR_NFT_URI
        ? BR_NFT_URI.startsWith("ipfs://") || BR_NFT_URI.startsWith("ar://")
          ? BR_NFT_URI
          : `ipfs://${BR_NFT_URI}`
        : "";
      if (!tokenUri) {
        setMintStatusMsg("Registrando participação…");
        const form = new FormData();
        form.append("name", "Lançamento Medialane no Brasil");
        form.append("description", "Registre-se e participe do airdrop de prêmios.");
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

  const handleWalletCreated = useCallback(() => {
    setWalletJustCreated(true);
    window.location.reload();
  }, []);

  const showingSections = isLoaded && !isSignedIn && !walletJustCreated;

  return (
    <div className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/30">
        <MedialaneLogo />
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal" forceRedirectUrl="/br/mint">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground hover:text-foreground">
              Entrar
            </Button>
          </SignInButton>
        )}
      </header>

      {/* Hero */}
      <div className="flex-1">
        <div className="container mx-auto px-5 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center py-12 lg:py-20">

            {/* Action panel */}
            <div className="space-y-6 order-1 lg:order-2">

              {/* Loading */}
              {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet) || walletJustCreated) && (
                <div className="space-y-4">
                  <div className="h-10 w-48 rounded-lg bg-muted/40 animate-pulse" />
                  <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
                  <div className="h-12 rounded-xl bg-muted/20 animate-pulse" />
                </div>
              )}

              {/* Not signed in */}
              {isLoaded && !isSignedIn && !walletJustCreated && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary/60">Medialane Brasil</p>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                      Airdrop de{" "}
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Prêmios
                      </span>
                    </h1>
                    <p className="text-[15px] text-muted-foreground leading-relaxed">
                      Participe do lançamento da Medialane. Reivindique seu registro e garanta seu lugar em{" "}
                      <strong className="text-foreground font-semibold">todas as distribuições</strong>{" "}
                      do fundo comunitário — completamente grátis.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
                      <Button
                        size="lg"
                        className="w-full rounded-2xl py-7 text-base font-bold gap-2.5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                      >
                        <Sparkles className="h-5 w-5" />
                        Participar com Google — é grátis
                      </Button>
                    </SignUpButton>
                    <SignInButton mode="modal" forceRedirectUrl="/br/mint">
                      <Button size="lg" variant="ghost" className="w-full rounded-xl text-sm text-muted-foreground hover:text-foreground">
                        Já tenho conta — entrar
                      </Button>
                    </SignInButton>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>Grátis</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>Sem CPF ou cartão</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60" />
                      <span>Acesso imediato</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Signed in, no wallet */}
              {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && !walletJustCreated && (
                <WalletSetup
                  email={user?.primaryEmailAddress?.emailAddress}
                  onDone={handleWalletCreated}
                />
              )}

              {/* Has wallet: claim flow */}
              {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && !walletJustCreated && (
                <div className="space-y-5">

                  {mintStep === "ready" && (
                    <>
                      <div>
                        <div className="flex items-center gap-2 text-sm mb-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Conta ativa</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
                          Airdrop de{" "}
                          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                            Prêmios
                          </span>
                        </h1>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                          Reivindique seu registro para garantir seu lugar no fundo comunitário.
                        </p>
                      </div>
                      <div className="space-y-2">
                        {[
                          { icon: FileCheck, label: "Registro de participação permanente" },
                          { icon: Coins,     label: "Elegível para todas as distribuições do fundo" },
                          { icon: Camera,    label: "Acesso completo à plataforma de criadores" },
                        ].map(({ icon: Icon, label }) => (
                          <div key={label} className="flex items-center gap-3 text-sm">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-1">
                        <Button
                          size="lg"
                          className="w-full rounded-xl h-12 text-base font-bold gap-2 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25 disabled:opacity-50"
                          onClick={() => setMintStep("enter-pin")}
                          disabled={!BR_MINT_CONTRACT}
                        >
                          <Sparkles className="h-4 w-4" />
                          {BR_MINT_CONTRACT ? "Reivindicar meu registro" : "Distribuição não iniciada"}
                          {BR_MINT_CONTRACT && <ArrowRight className="h-4 w-4 ml-auto" />}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Seu comprovante permanente de participação na Medialane.
                        </p>
                      </div>
                    </>
                  )}

                  {mintStep === "enter-pin" && (
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
                      <div>
                        <p className="font-bold">Confirme com seu código de segurança</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Digite o código de 6 dígitos criado ao ativar sua conta.
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Registro</span>
                        <span className="font-medium">Único · permanente</span>
                        <span className="text-muted-foreground">Valor</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Grátis</span>
                        <span className="text-muted-foreground">Taxas</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Nenhuma</span>
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

                  {mintStep === "minting" && (
                    <div className="rounded-2xl border border-border/60 bg-card/50 p-6">
                      <div className="flex items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary shrink-0" />
                        <div>
                          <p className="font-bold">Registrando sua participação…</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{mintStatusMsg || "Aguarde…"}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        {[
                          { label: "Preparando seu registro",         done: status !== "idle" },
                          { label: "Enviando para a rede",            done: status === "confirming" || status === "confirmed" },
                          { label: "Confirmado!",                     done: status === "confirmed" },
                        ].map(({ label, done }) => (
                          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                            {done
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              : <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30" />}
                            <span className={done ? "text-foreground" : ""}>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mintStep === "success" && (
                    <div className="space-y-5">
                      <div>
                        <h1 className="text-5xl font-black tracking-tight leading-[1.05]">
                          Você está{" "}
                          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">dentro!</span>
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2">Sua participação no Airdrop de Prêmios está confirmada.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-bold text-emerald-600 dark:text-emerald-300">Participação confirmada!</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Seja bem-vindo à Medialane.</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                            <Trophy className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
                            <span>Elegível para o fundo comunitário de criadores</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5">
                            <Camera className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span>Publique e compartilhe seu conteúdo</span>
                          </div>
                        </div>
                        {completedTxHash && (
                          <a
                            href={`${EXPLORER_URL}/tx/${completedTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <span className="font-mono">{completedTxHash.slice(0, 12)}…{completedTxHash.slice(-8)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Button size="lg" className="flex-1 p-4" asChild>
                          <Link href="/create/asset">Publicar conteúdo</Link>
                        </Button>
                        <Button size="lg" variant="outline" className="flex-1 p-4" asChild>
                          <Link href="/marketplace">Explorar o app</Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {mintStep === "error" && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-sm">Não foi possível registrar</p>
                            {(mintError || txError) && (
                              <p className="text-xs text-muted-foreground mt-1">{mintError || txError}</p>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                          <RefreshCw className="h-3.5 w-3.5" />
                          Tentar novamente
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-sm">
                <EventCard />
              </div>
            </div>

          </div>

          {/* Below-fold content: only for non-signed-in visitors */}
          {showingSections && (
            <>
              <OQueVoceGanha />
              <ComoFunciona />
              <FasesDoFundo />
              <div className="py-10">
                <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl py-7 text-base font-bold gap-2.5 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 shadow-lg shadow-primary/25"
                  >
                    <Sparkles className="h-5 w-5" />
                    Participar com Google — é grátis
                  </Button>
                </SignUpButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-6 pt-4">
          Participação gratuita · Sem necessidade de compra · A distribuição do fundo é gerida pela comunidade Medialane DAO ·{" "}
          <Link href="/campaign-terms" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Ver regulamento
          </Link>
        </p>
        <div className="px-6 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">Termos</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
          <Link href="/campaign-terms" className="hover:text-foreground transition-colors">Campanha</Link>
          <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Sobre</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}
