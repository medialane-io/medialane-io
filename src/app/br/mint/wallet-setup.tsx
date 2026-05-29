"use client";

import { useState, useCallback } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { completeOnboarding } from "@/app/onboarding/_actions";

/**
 * Brazil airdrop onboarding step — Portuguese localized wallet setup.
 * Extracted from br-mint-content.tsx to keep each file focused on one
 * lifecycle stage (sign-in → wallet setup → mint claim).
 */

type WalletSetupStep = "choose" | "pin" | "passkey" | "creating" | "done";

export function WalletSetup({ email, onDone }: { email?: string | null; onDone: () => void }) {
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
        <p className="font-bold">Finalize seu acesso</p>
        {step === "pin" && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Crie um PIN de 6 dígitos para confirmar sua participação.
          </p>
        )}
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
            Face ID / Chave de acesso
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
