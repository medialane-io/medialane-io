"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth, useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useClerk } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { serializeByteArray } from "@/lib/cairo-calldata";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  Camera,
  ImageIcon,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  FileCheck,
  Coins,
  Users,
  Palette,
  Globe,
  Music,
  Shield,
  Info,
  PenLine,
  ShoppingCart,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI, BR_NFT_IMAGE_URL } from "@/lib/constants";

// ─── Imagem do NFT ────────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = BR_NFT_IMAGE_URL || "/genesis.jpg";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/10 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-primary/40" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Medialane Brasil 2026</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Medialane Airdrop de Prêmios"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
import { completeOnboarding } from "@/app/onboarding/_actions";

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

  const [passkeySupported] = useState(() => typeof window !== "undefined" && isWebAuthnSupported());
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
      setError(err instanceof Error ? err.message : "Erro na configuração. Tente o PIN.");
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
      setError(err instanceof Error ? err.message : "Falha ao ativar. Tente novamente.");
      setStep("pin");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "creating" || step === "passkey") {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-semibold text-sm text-muted-foreground">Ativando sua conta…</p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="font-semibold text-emerald-600 dark:text-emerald-300">Conta ativada!</p>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {email && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{email}</span>
        </div>
      )}
      <div>
        <p className="font-bold">Proteja sua conta</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {step === "pin"
            ? "Crie um PIN de 6 dígitos para confirmar sua participação."
            : "Adicione Face ID, digital ou um PIN."}
        </p>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {step === "choose" && (
        <div className="space-y-2">
          <Button size="lg" className="w-full h-12 font-bold gap-2" onClick={handlePasskey} disabled={isSubmitting}>
            <ShieldCheck className="h-4 w-4" />
            Usar Face ID / digital
          </Button>
          <Button size="lg" variant="outline" className="w-full h-12 gap-2" onClick={() => setStep("pin")} disabled={isSubmitting}>
            <KeyRound className="h-4 w-4" />
            Criar PIN
          </Button>
        </div>
      )}
      {step === "pin" && (
        <div className="space-y-3">
          <PinInput
            value={pin}
            onChange={(v) => { setPin(v); setPinError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 6) handlePin(); }}
            error={pinError}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="lg" className="flex-1 h-12 font-bold" onClick={handlePin} disabled={pin.length < 6 || isSubmitting}>
              Ativar minha conta
            </Button>
            {passkeySupported && (
              <Button size="lg" variant="outline" className="h-12" onClick={() => { setStep("choose"); setPin(""); setPinError(null); setError(null); }}>
                Voltar
              </Button>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-muted-foreground text-center">Seu PIN ou passkey nunca é compartilhado ou armazenado.</p>
    </div>
  );
}

// ─── Mint de Participação ─────────────────────────────────────────────────────

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

function GenesisMint() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, error: txError, reset } = useChipiTransaction();

  const [passkeySupported] = useState(() => typeof window !== "undefined" && isWebAuthnSupported());
  const { authenticate, encryptKey } = usePasskeyAuth();

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

  const executeMint = useCallback(async (key: string) => {
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
      const calldata = [walletAddress, ...serializeByteArray(tokenUri)];

      const result = await executeTransaction({
        pin: key,
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
  }, [walletAddress, storageKey, executeTransaction]);

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    await executeMint(mintPin);
  }, [mintPin, executeMint]);

  const handleClaimWithPasskey = useCallback(async () => {
    setMintError(null);
    try {
      const key = encryptKey ?? await authenticate();
      if (!key) throw new Error("Autenticação falhou. Tente novamente.");
      await executeMint(key);
    } catch (err: unknown) {
      setMintStep("error");
      setMintError(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
    }
  }, [encryptKey, authenticate, executeMint]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setMintStep("ready");
  };

  const handleResetMintGate = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [storageKey]);

  const handleWalletCreated = useCallback(() => {
    setWalletJustCreated(true);
    window.location.reload();
  }, []);

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-4">
      
      {/* 
      <div className="flex items-center gap-2 pb-1 border-b border-border/30">
        <Sparkles className="h-4 w-4 text-yellow-500" />
        <p className="font-bold text-sm">Reivindique seu passaporte de participação</p>
      </div>*/ }

      {(!isLoaded || (isLoaded && isSignedIn && isLoadingWallet) || walletJustCreated) && (
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      )}

      {isLoaded && !isSignedIn && !walletJustCreated && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Acesse com sua conta Google.</p>
          <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
            <Button size="lg" className="w-full h-12 font-bold gap-2 rounded-xl">
              <Sparkles className="h-4 w-4" />
              Participe grátis - Sem cadastro
            </Button>
          </SignUpButton>
          <SignInButton mode="modal" forceRedirectUrl="/br/mint">
            <Button size="lg" variant="ghost" className="w-full text-sm text-muted-foreground">
              Já tenho conta — entrar
            </Button>
          </SignInButton>
        </div>
      )}

      {isLoaded && !isLoadingWallet && isSignedIn && !hasWallet && !walletJustCreated && (
        <WalletSetup email={user?.primaryEmailAddress?.emailAddress} onDone={handleWalletCreated} />
      )}

      {isLoaded && !isLoadingWallet && isSignedIn && hasWallet && !walletJustCreated && (
        <div className="space-y-3">

          {mintStep === "ready" && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Conta ativa, minte seu passaporte</span>
              </div>
              <Button
                size="lg"
                className="w-full h-12 font-bold gap-2 disabled:opacity-50"
                onClick={() => setMintStep("enter-pin")}
                disabled={!BR_MINT_CONTRACT}
              >
                <Sparkles className="h-4 w-4" />
                {BR_MINT_CONTRACT ? "Garantir meu lugar" : "Distribuição não iniciada"}
              </Button>
            </>
          )}

          {mintStep === "enter-pin" && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-sm">Confirme sua participação</p>
                <p className="text-xs text-muted-foreground mt-0.5">Use biometria ou seu PIN de segurança.</p>
              </div>
              {passkeySupported && (
                <Button size="lg" className="w-full h-11 font-bold gap-2" onClick={handleClaimWithPasskey}>
                  <ShieldCheck className="h-4 w-4" />
                  Confirmar com Face ID / digital
                </Button>
              )}
              {passkeySupported && (
                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-muted-foreground">ou use seu PIN</span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
              )}
              <PinInput
                value={mintPin}
                onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && mintPin.length >= 6) handleClaim(); }}
                placeholder="Seu código de segurança"
                error={mintPinError}
                autoFocus={!passkeySupported}
              />
              <div className="flex gap-2">
                <Button size="lg" className="flex-1 h-11 font-bold" onClick={handleClaim} disabled={mintPin.length < 6}>
                  Confirmar com PIN
                </Button>
                <Button size="lg" variant="outline" className="h-11" onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {mintStep === "minting" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Registrando sua participação…</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{mintStatusMsg || "Aguarde…"}</p>
                </div>
              </div>
              <div className="space-y-1.5 pl-9">
                {[
                  { label: "Preparando seu registro",   done: status !== "idle" },
                  { label: "Enviando",                  done: status === "confirming" || status === "confirmed" },
                  { label: "Confirmado",                done: status === "confirmed" },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                    {done ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />}
                    <span className={done ? "text-foreground" : ""}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mintStep === "success" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-bold text-emerald-600 dark:text-emerald-300">Você está dentro!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Sua participação está confirmada.</p>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button size="sm" asChild className="flex-1">
                  <Link href="/create/asset">Publicar conteúdo</Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link href="/marketplace">Explorar o app</Link>
                </Button>
              </div>
              <button className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center" onClick={handleResetMintGate}>
                Não mintou seu passaporte? Tente novamente
              </button>
            </div>
          )}

          {mintStep === "error" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Não foi possível registrar</p>
                  {(mintError || txError) && <p className="text-xs text-muted-foreground mt-0.5">{mintError || txError}</p>}
                </div>
              </div>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
              </Button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BrMintContent() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Cabeçalho */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <MedialaneLogo />
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal" forceRedirectUrl="/br/mint">
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">Entrar</Button>
          </SignInButton>
        )}
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Hero: 2 colunas no desktop ── */}
          <section className="py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Esquerda: badge + título + participação */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Medialane Brasil</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  Participe da{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Campanha de Lançamento
                  </span>
                </h1>
                <GenesisMint />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Medialane é um app para criadores publicar, compartilhar e monetizar conteúdo. Participação grátis.
                </p>
                <div className="flex items-center gap-4">
                  {["Grátis", "Sem cartão", "Imediato"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direita: imagem (sticky no desktop) */}
              <div className="lg:sticky lg:top-24">
                <EventCard />
              </div>

            </div>
          </section>

          
          <section className="py-10 border-t border-border/30 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Fundo para Criadores</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileCheck, color: "text-blue-400",   bg: "bg-blue-500/10",   title: "Participe sem cadastro", desc: "Acesse grátis com sua conta Google" },
                { icon: Coins,     color: "text-yellow-500", bg: "bg-yellow-500/10", title: "Fundo de criadores", desc: "Distribuição de fundos para todos os participantes." },
                { icon: Users,     color: "text-purple-400", bg: "bg-purple-500/10", title: "Aumente suas chances", desc: "Crie, compartilhe e colecione!." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Níveis de participação ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Como funciona</p>
              <h2 className="text-2xl sm:text-3xl font-black">Participe em poucos segundos.</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Acesse com sua conta Google é tudo o que você precisa para participar.
              </p>
            </div>

            {/* Nível base — destaque */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-lg">Acesso com Google</p>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Mínimo — você está dentro</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Faça login com sua conta Google e defina uma senha ou passkey para proteger sua conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Níveis bônus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Bônus</span>
                </div>
                <div>
                  <p className="font-bold">Crie conteúdo</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Publique fotos, músicas, arte ou textos. Criadores recebem uma fatia maior de cada distribuição.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">Maior bônus</span>
                </div>
                <div>
                  <p className="font-bold">Compre e colecione</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Compre, venda e colabore com outros criadores. Participantes ativos recebem a maior fatia.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Fases de distribuição ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribuição</p>
              <h2 className="text-2xl sm:text-3xl font-black">Fases do fundo de criadores</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                O fundo distribui a receita da plataforma para os participantes. As distribuições são baseadas em metas da comunidade.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Fase 1</p>
                  <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">5.000 membros</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Primeira distribuição. Todos os participantes elegíveis recebem uma parte proporcional com base em sua atividade.
                </p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Fase 2</p>
                  <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">10.000 membros</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Segunda distribuição, incluindo toda a receita acumulada desde a Fase 1. As pontuações são recalculadas desde o lançamento.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                As Fases 1 e 2 são as distribuições do primeiro ano da plataforma. Essas metas são objetivos, não garantias.
              </p>
            </div>
          </section>

          {/* ── Elegibilidade + Aviso legal ── */}
          <section className="py-10 border-t border-border/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Elegibilidade</p>
                  <h2 className="text-2xl font-black">Quem é elegível</h2>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { ok: true,  text: "Qualquer pessoa que criar uma conta gratuita e reivindicar seu registro." },
                    { ok: true,  text: "Contas que publicam conteúdo original recebem uma fatia maior." },
                    { ok: true,  text: "Participantes ativos que negociam ou colaboram recebem a maior fatia." },
                    { ok: false, text: "Contas que usam ferramentas automatizadas ou cadastros duplicados são desqualificadas." },
                    { ok: false, text: "Contas flagradas inflando artificialmente suas pontuações são desqualificadas." },
                  ].map(({ ok, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-2xl font-black">Aviso legal</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>A Medialane é uma plataforma para criação e monetização de conteúdo autoral e propriedade intelectual feita para criadores. Esta campanha não é um produto financeiro, esquema de investimento, loteria ou serviço de apostas.</p>
                  <p>A participação não garante nenhum retorno financeiro. As distribuições serão realizadas a critério da comunidade e podem tomar a forma de créditos, ativos digitais ou outros recursos.</p>
                  <p>O registro de participação é um comprovante digital de participação no lançamento Medialane. Não possui valor monetário intrínseco e não é um instrumento financeiro.</p>
                  <p>
                    Ao participar, você concorda com o{" "}
                    <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Regulamento da Campanha</a>
                    {" "}e os{" "}
                    <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Termos de Uso</a>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Bottom CTA (apenas visitantes) ── */}
          {isLoaded && !isSignedIn && (
            <section className="py-10 border-t border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Participe grátis</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Acesse com sua conta Google.</p>
                </div>
                <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
                  <Button size="lg" className="gap-2 shrink-0 font-bold">
                    <Sparkles className="h-4 w-4" />
                    Garantir meu lugar!
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
              </div>
            </section>
          )}

          <div className="pb-12" />
        </div>
      </div>

      {/* Rodapé */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-5 pt-4">
          Participação gratuita · Sem necessidade de compra ·{" "}
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Ver regulamento
          </a>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Termos</a>
          <a href="https://docs.medialane.io/guidelines/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Campanha</a>
          <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Sobre</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}
