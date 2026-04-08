"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertCircle, HandCoins, ExternalLink, Loader2, LogIn, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fireConfetti } from "@/lib/confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMarketplace } from "@/hooks/use-marketplace";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { parseFormPriceUsdc } from "@/lib/chipi/session-preferences";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { getListableTokens } from "@medialane/sdk";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { marketplacePriceField, marketplaceCurrencyField, marketplaceDurationField } from "@/lib/marketplace-schemas";

const CURRENCIES = getListableTokens().map((t) => t.symbol);

const schema = z.object({
  price: marketplacePriceField,
  currency: marketplaceCurrencyField,
  durationSeconds: marketplaceDurationField,
});

type FormValues = z.infer<typeof schema>;

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetContract: string;
  tokenId: string;
  tokenName?: string;
}

export function OfferDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
}: OfferDialogProps) {
  const { isSignedIn } = useAuth();
  const {
    makeOffer,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "pin">("form");

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const [isActivatingSession, setIsActivatingSession] = useState(false);
  const { authenticate, encryptKey } = usePasskeyAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000 },
  });

  const onSubmit = async (values: FormValues) => {
    if (!isSignedIn) return;
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    const priceUsdc = parseFormPriceUsdc(values.price);
    const cleared = await maybeClearSessionForAmountCap(priceUsdc);
    if (cleared) {
      toast.info("Large offer — fresh signing session", {
        description:
          "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
      });
    }
    setStep("pin");
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    if (!pendingValues) return;

    if (!hasActiveSession) {
      setIsActivatingSession(true);
      try {
        await setupSession(pin);
      } catch (err: unknown) {
        setPinError(err instanceof Error ? err.message : "Session setup failed. Please try again.");
        return;
      } finally {
        setIsActivatingSession(false);
      }
    }

    await makeOffer({
      assetContract,
      tokenId,
      tokenName,
      price: pendingValues.price,
      currencySymbol: pendingValues.currency,
      durationSeconds: pendingValues.durationSeconds,
      pin,
    });
    setPin("");
    setStep("form");
  };

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      if (!pendingValues) return;

      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");

      if (!hasActiveSession) {
        await setupSession(derived);
      }

      await makeOffer({
        assetContract,
        tokenId,
        tokenName,
        price: pendingValues.price,
        currencySymbol: pendingValues.currency,
        durationSeconds: pendingValues.durationSeconds,
        pin: derived,
      });

      setPin("");
      setStep("form");
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) onOpenChange(v);
  };

  // Reset to fresh form state each time the dialog opens.
  // Resetting on close causes the dialog to flash to form state mid-animation;
  // resetting on open guarantees a clean slate without touching closing content.
  useEffect(() => {
    if (open) {
      resetState();
      form.reset();
      setPendingValues(null);
      setPin("");
      setPinError(null);
      setStep("form");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSuccess = !isProcessing && txStatus === "confirmed" && !error;
  const confettiFired = useRef(false);

  useEffect(() => {
    if (isSuccess && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "pin" ? "Confirm with PIN" : "Make an offer"}
            </DialogTitle>
          </DialogHeader>

          {!isSignedIn ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <LogIn className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Sign in to make an offer</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need a Medialane account to place offers.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full">Sign in</Button>
              </SignInButton>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-5 py-2">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-xl">Offer live!</p>
                <p className="text-sm text-muted-foreground">
                  Your offer of{" "}
                  <span className="font-medium text-foreground">
                    {pendingValues?.price} {pendingValues?.currency}
                  </span>{" "}
                  on {tokenName || `Token #${tokenId}`} is now active.
                </p>
              </div>
              {txHash && (
                <a
                  href={`${EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <Button className="w-full" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          ) : isActivatingSession ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Activating wallet session…</p>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting" ? "Submitting offer…" : "Confirming on Starknet…"}
              </p>
            </div>
          ) : step === "pin" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-mono">#{tokenId}</Badge>
                <span className="text-sm font-medium truncate">
                  {pendingValues?.price} {pendingValues?.currency} · {tokenName || `Token #${tokenId}`}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your security PIN to sign the offer.
              </p>
              <PinInput
                value={pin}
                onChange={(v) => { setPin(v); setPinError(null); }}
                error={pinError}
                autoFocus
              />
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => { setStep("form"); setPin(""); setPinError(null); }}
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={pin.length < 6}
                  onClick={handlePin}
                >
                  <HandCoins className="h-4 w-4 mr-2" />
                  Send offer
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Your offer will be pushed onchain. Transaction sponsored by Medialane.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-mono">#{tokenId}</Badge>
                <span className="text-sm font-medium truncate">{tokenName || `Token #${tokenId}`}</span>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer price</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              className="pr-20"
                              disabled={isProcessing}
                              {...field}
                            />
                          </FormControl>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <CurrencyIcon symbol={form.watch("currency")} size={14} />
                            <span className="text-xs font-bold">{form.watch("currency")}</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-5 gap-1.5">
                            {CURRENCIES.map((c) => (
                              <Button
                                key={c}
                                type="button"
                                variant={field.value === c ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(c)}
                                disabled={isProcessing}
                                className="gap-1 px-2 text-xs w-full"
                              >
                                <CurrencyIcon symbol={c} size={13} className="shrink-0" />
                                <span className="truncate">{c}</span>
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            {DURATION_OPTIONS.map((opt) => (
                              <Button
                                key={opt.label}
                                type="button"
                                variant={field.value === opt.seconds ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(opt.seconds)}
                                disabled={isProcessing}
                                className="text-xs"
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-11" disabled={isProcessing}>
                    <HandCoins className="h-4 w-4 mr-2" />
                    {hasWallet ? "Submit offer" : "Secure account & offer"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Your offer will be pushed onchain. Transaction sponsored by Medialane.
                  </p>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setStep("pin");
        }}
      />
    </>
  );
}
