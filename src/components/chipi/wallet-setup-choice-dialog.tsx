"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth, useUser, useClerk } from "@clerk/nextjs";
import { useChipiWallet, isWebAuthnSupported, createWalletPasskey } from "@chipi-stack/nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { Button } from "@/components/ui/button";
import { completeOnboarding } from "@/app/onboarding/_actions";

type Locale = "en" | "pt";

const COPY: Record<Locale, {
  title: string;
  descPasskey: string;
  descPin: string;
  passkeyCta: string;
  pinCta: string;
  pinSwitch: string;
  passkeySwitch: string;
  doneTitle: string;
  doneDesc: string;
  doneCta: string;
  loading: string;
  pinPlaceholder: string;
  footer: string;
  fallbackError: string;
}> = {
  en: {
    title: "Secure your account",
    descPasskey: "Use Face ID, Touch ID, or a passkey.",
    descPin: "Create a 6-digit security PIN.",
    passkeyCta: "Use Passkey",
    pinCta: "Activate my account",
    pinSwitch: "Create PIN",
    passkeySwitch: "Use Passkey instead",
    doneTitle: "Account secured!",
    doneDesc: "You're all set.",
    doneCta: "Continue",
    loading: "Securing your account…",
    pinPlaceholder: "Enter 6-digit PIN",
    footer: "Your PIN or passkey is never stored.",
    fallbackError: "Passkey setup didn't complete. Try a PIN instead.",
  },
  pt: {
    title: "Proteja sua conta",
    descPasskey: "Use Face ID, digital ou Touch ID.",
    descPin: "Crie um PIN de 6 dígitos.",
    passkeyCta: "Usar Face ID / digital",
    pinCta: "Ativar minha conta",
    pinSwitch: "Criar PIN",
    passkeySwitch: "Usar Face ID / digital",
    doneTitle: "Conta ativada!",
    doneDesc: "Tudo pronto.",
    doneCta: "Continuar",
    loading: "Ativando sua conta…",
    pinPlaceholder: "Digite seu PIN",
    footer: "Seu PIN ou passkey nunca é armazenado.",
    fallbackError: "Não foi possível usar Face ID. Tente com PIN.",
  },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Fires after the wallet is fully created. Receives the encryption key
   * (PIN string or PRF-derived passkey key) so the caller can chain the
   * next operation — e.g. minting immediately without prompting again.
   */
  onSuccess?: (encryptKey: string) => void;
  locale?: Locale;
}

export function WalletSetupChoiceDialog({ open, onOpenChange, onSuccess, locale = "en" }: Props) {
  const t = COPY[locale];
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const { session } = useClerk();

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { createWallet } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: false,
  });

  const [passkeySupported] = useState(() => typeof window !== "undefined" && isWebAuthnSupported());
  const [view, setView] = useState<"choose" | "pin" | "creating" | "done">("choose");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setView(passkeySupported ? "choose" : "pin");
      setPin("");
      setPinError(null);
      setError(null);
    }
  }, [open, passkeySupported]);

  const createWalletWithKey = async (encryptKey: string) => {
    const wallet = await createWallet({ encryptKey });
    const walletKey = wallet.normalizedPublicKey ?? wallet.publicKey;
    if (!walletKey) throw new Error("Wallet creation returned invalid data");
    const result = await completeOnboarding({ publicKey: walletKey });
    if (result.error) throw new Error(result.error);
    await user?.reload();
    await session?.touch();
    // If a caller is wired to chain the next operation (e.g. mint), hand
    // the encryption key over and let it transition — the brief "done"
    // success view would otherwise flash before the parent closes us.
    if (onSuccess) {
      onSuccess(encryptKey);
    } else {
      setView("done");
    }
  };

  const handlePasskey = async () => {
    setError(null);
    setView("creating");
    try {
      const userName = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "user";
      const { encryptKey } = await createWalletPasskey(user?.id ?? "", userName);
      await createWalletWithKey(encryptKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.fallbackError);
      setView("pin");
    }
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    setError(null);
    setView("creating");
    try {
      await createWalletWithKey(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate. Please try again.");
      setView("pin");
    }
  };

  const handleClose = () => {
    if (view === "creating") return;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">{t.title}</DialogTitle>
          <DialogDescription className="text-center">
            {view === "pin" ? t.descPin : t.descPasskey}
          </DialogDescription>
        </DialogHeader>

        {view === "creating" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        )}

        {view === "done" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="font-semibold">{t.doneTitle}</p>
            <p className="text-sm text-muted-foreground text-center">{t.doneDesc}</p>
            <Button className="w-full mt-2" onClick={handleClose}>{t.doneCta}</Button>
          </div>
        )}

        {view === "choose" && (
          <div className="flex flex-col gap-3 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button size="lg" className="w-full gap-2" onClick={handlePasskey}>
              <ShieldCheck className="h-4 w-4" />
              {t.passkeyCta}
            </Button>
            <button
              type="button"
              onClick={() => { setView("pin"); setError(null); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t.pinSwitch}
            </button>
            <p className="text-xs text-muted-foreground text-center pt-2">{t.footer}</p>
          </div>
        )}

        {view === "pin" && (
          <div className="flex flex-col gap-3 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <PinInput
              value={pin}
              onChange={(v) => { setPin(v); setPinError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 6) handlePin(); }}
              error={pinError}
              placeholder={t.pinPlaceholder}
              autoFocus
            />
            <Button size="lg" className="w-full" disabled={pin.length < 6} onClick={handlePin}>
              {t.pinCta}
            </Button>
            {passkeySupported && (
              <button
                type="button"
                onClick={() => { setView("choose"); setPin(""); setPinError(null); setError(null); }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t.passkeySwitch}
              </button>
            )}
            <p className="text-xs text-muted-foreground text-center pt-2">{t.footer}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
