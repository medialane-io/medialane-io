"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { useSessionKey } from "@/hooks/use-session-key";
import { usePasskeyAuth, usePasskeyStatus } from "@chipi-stack/chipi-passkey/hooks";
import { serializeByteArray } from "@/lib/cairo-calldata";
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Loader2,
  RefreshCw,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { looksLikeEncryptionFailure } from "@/lib/chipi/looks-like-encryption-failure";
import { WalletSetup } from "./wallet-setup";
import { EXPLORER_URL, BR_MINT_CONTRACT, BR_NFT_URI } from "@/lib/constants";

type MintStep = "ready" | "enter-pin" | "minting" | "success" | "error";

export function GenesisMint() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { executeTransaction, status, error: txError, reset } = useChipiTransaction();

  const { status: { hasPasskey, isSupported: passkeySupported } } = usePasskeyStatus();
  const { authenticate, encryptKey } = usePasskeyAuth();

  const [mintStep, setMintStep] = useState<MintStep>("ready");
  const [mintPin, setMintPin] = useState("");
  const [mintPinError, setMintPinError] = useState<string | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintStatusMsg, setMintStatusMsg] = useState("");
  const [completedTxHash, setCompletedTxHash] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"pin" | "passkey">("pin");
  const [encryptionMismatch, setEncryptionMismatch] = useState<"pin" | "passkey" | null>(null);

  useEffect(() => {
    if (passkeySupported && hasPasskey) setAuthMethod("passkey");
  }, [passkeySupported, hasPasskey]);

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
      const msg = err instanceof Error ? err.message : "Algo deu errado. Tente novamente.";
      setMintStep("error");
      setMintError(msg);
      if (looksLikeEncryptionFailure(msg)) {
        setEncryptionMismatch(authMethod === "pin" ? "passkey" : "pin");
      }
    }
  }, [walletAddress, storageKey, executeTransaction, authMethod]);

  const handleClaim = useCallback(async () => {
    const err = validatePin(mintPin);
    if (err) { setMintPinError(err); return; }
    setMintPinError(null);
    setEncryptionMismatch(null);
    await executeMint(mintPin);
  }, [mintPin, executeMint]);

  const handleClaimWithPasskey = useCallback(async () => {
    setMintError(null);
    setEncryptionMismatch(null);
    try {
      const key = encryptKey ?? await authenticate();
      if (!key) throw new Error("Autenticação falhou. Tente novamente.");
      await executeMint(key);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Algo deu errado. Tente novamente.";
      setMintStep("error");
      setMintError(msg);
      if (looksLikeEncryptionFailure(msg)) setEncryptionMismatch("pin");
    }
  }, [encryptKey, authenticate, executeMint]);

  const handleRetry = () => {
    reset();
    setMintPin("");
    setMintPinError(null);
    setMintError(null);
    setEncryptionMismatch(null);
    setMintStep("ready");
  };

  const handleSwitchMethod = (target: "pin" | "passkey") => {
    setAuthMethod(target);
    setEncryptionMismatch(null);
    setMintError(null);
    setMintPin("");
    setMintPinError(null);
    setMintStep("enter-pin");
  };

  const handleResetMintGate = useCallback(() => {
    if (storageKey) localStorage.removeItem(storageKey);
    setCompletedTxHash(null);
    setMintStep("ready");
  }, [storageKey]);

  const handleWalletCreated = useCallback(() => {
    // wallet just created → useSessionKey will refresh on next render and
    // surface the mint CTA. Nothing else to do here.
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (!isLoaded || (isLoaded && isSignedIn && isLoadingWallet)) {
    return (
      <div className="flex items-center gap-3 py-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="space-y-3">
        <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
          <div className="btn-border-animated p-[1px] rounded-2xl cursor-pointer">
            <Button
              size="lg"
              className="w-full h-12 font-bold gap-2 bg-transparent text-white rounded-[15px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Participar com Google ou email
            </Button>
          </div>
        </SignUpButton>
      </div>
    );
  }

  if (!hasWallet) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/50 p-5">
        <WalletSetup email={user?.primaryEmailAddress?.emailAddress} onDone={handleWalletCreated} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-4">
      {mintStep === "ready" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {hasWallet ? "Conta ativa, minte seu passaporte" : "Tudo pronto. Garanta seu lugar."}
            </span>
          </div>
          <div className="btn-border-animated p-[1px] rounded-2xl">
            <Button
              size="lg"
              className="w-full h-12 font-bold gap-2 bg-transparent text-white rounded-[15px] hover:bg-transparent hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
              onClick={() => setMintStep("enter-pin")}
              disabled={!BR_MINT_CONTRACT}
            >
              <Sparkles className="h-4 w-4" />
              {BR_MINT_CONTRACT ? "Garantir meu lugar" : "Distribuição não iniciada"}
            </Button>
          </div>
        </div>
      )}

      {mintStep === "enter-pin" && (
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-sm">Confirme sua participação</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {authMethod === "passkey" ? "Use sua biometria." : "Use seu PIN de segurança."}
            </p>
          </div>
          {authMethod === "passkey" ? (
            <div className="flex gap-2">
              <Button size="lg" className="flex-1 h-11 font-bold gap-2" onClick={handleClaimWithPasskey}>
                <ShieldCheck className="h-4 w-4" />
                Confirmar com Face ID / digital
              </Button>
              <Button size="lg" variant="outline" className="h-11" onClick={() => setMintStep("ready")}>
                Cancelar
              </Button>
            </div>
          ) : (
            <>
              <PinInput
                value={mintPin}
                onChange={(v) => { setMintPin(v); setMintPinError(null); }}
                onKeyDown={(e) => { if (e.key === "Enter" && mintPin.length >= 6) handleClaim(); }}
                placeholder="Seu código de segurança"
                error={mintPinError}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="lg" className="flex-1 h-11 font-bold" onClick={handleClaim} disabled={mintPin.length < 6}>
                  Confirmar com PIN
                </Button>
                <Button size="lg" variant="outline" className="h-11" onClick={() => { setMintPin(""); setMintPinError(null); setMintStep("ready"); }}>
                  Cancelar
                </Button>
              </div>
            </>
          )}
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
              { label: "Preparando seu registro", done: status !== "idle" },
              { label: "Enviando", done: status === "confirming" || status === "confirmed" },
              { label: "Confirmado", done: status === "confirmed" },
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
          {encryptionMismatch && (encryptionMismatch === "pin" || passkeySupported) && (
            <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-xs text-destructive/90">
                {encryptionMismatch === "passkey"
                  ? "Parece que sua conta usa Face ID / digital. Tente com biometria."
                  : "Parece que sua conta usa PIN. Tente com seu código de segurança."}
              </p>
              <Button size="sm" className="gap-2" onClick={() => handleSwitchMethod(encryptionMismatch)}>
                {encryptionMismatch === "passkey"
                  ? (<><ShieldCheck className="h-3.5 w-3.5" /> Usar Face ID / digital</>)
                  : "Usar PIN"}
              </Button>
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={handleRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}
