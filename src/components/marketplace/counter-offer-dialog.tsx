"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertCircle, ArrowLeftRight, ExternalLink, Loader2, LogIn, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMarketplace } from "@/hooks/use-marketplace";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

/** Convert a human-readable amount string to raw wei integer string. */
function toRawWei(humanAmount: string, decimals: number): string {
  const parts = humanAmount.replace(/,/g, "").split(".");
  const integer = BigInt(parts[0] || "0");
  const fraction = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return (integer * BigInt(10 ** decimals) + BigInt(fraction)).toString();
}

const schema = z.object({
  price: z.string().min(1, "Price required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Must be a positive number"
  ),
  durationSeconds: z.number().int().min(3600),
  message: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalOrderHash: string;
  tokenName?: string;
  /** Human-readable current bid (e.g. "12.5 USDC") — shown for reference */
  currentBid?: string;
  currencySymbol: string;
  currencyDecimals: number;
}

export function CounterOfferDialog({
  open,
  onOpenChange,
  originalOrderHash,
  tokenName,
  currentBid,
  currencySymbol,
  currencyDecimals,
}: CounterOfferDialogProps) {
  const { isSignedIn } = useAuth();
  const {
    makeCounterOffer,
    hasWallet,
    hasActiveSession,
    isSettingUpSession,
    setupSession,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useMarketplace();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [sessionSetupOpen, setSessionSetupOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "pin">("form");

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const { authenticate, encryptKey } = usePasskeyAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", durationSeconds: 604800, message: "" },
  });

  const onSubmit = (values: FormValues) => {
    if (!isSignedIn) return;
    setPendingValues(values);
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    if (!hasActiveSession) { setSessionSetupOpen(true); return; }
    setStep("pin");
  };

  const handleSessionSetup = async (pin: string) => {
    try {
      await setupSession(pin);
      setSessionSetupOpen(false);
      setStep("pin");
    } catch {
      toast.error("Session setup failed. Please try again.");
    }
  };

  const execWithPin = async (pinValue: string) => {
    if (!pendingValues) return;
    await makeCounterOffer({
      originalOrderHash,
      counterPriceRaw: toRawWei(pendingValues.price, currencyDecimals),
      durationSeconds: pendingValues.durationSeconds,
      message: pendingValues.message || undefined,
      tokenName,
      pin: pinValue,
    });
    setPin("");
    setStep("form");
  };

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    await execWithPin(pin);
  };

  const handleUsePasskey = async () => {
    setPinError(null);
    setIsAuthenticatingPasskey(true);
    try {
      const derived = encryptKey ?? (await authenticate());
      if (!derived) throw new Error("Passkey authentication failed.");
      await execWithPin(derived);
    } catch (err: unknown) {
      toast.error("Passkey authentication failed", {
        description: err instanceof Error ? err.message : "Passkey authentication failed",
      });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      setPendingValues(null);
      setPin("");
      setPinError(null);
      setStep("form");
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed" && !error;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "pin" ? "Confirm with PIN" : "Send a counter-offer"}
            </DialogTitle>
            {step === "form" && (
              <DialogDescription>
                Propose a different price to the buyer. Your NFT will be listed as a
                counter-offer — verifiable on-chain.
              </DialogDescription>
            )}
          </DialogHeader>

          {!isSignedIn ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <LogIn className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Sign in to send a counter-offer</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need a Medialane account to counter bids.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full">Sign in</Button>
              </SignInButton>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold text-lg">Counter-offer sent!</p>
              <p className="text-sm text-muted-foreground text-center">
                Your counter of {pendingValues?.price} {currencySymbol} on{" "}
                {tokenName || "this token"} is now live as an on-chain listing.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button className="w-full" onClick={() => handleClose(false)}>Done</Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting" ? "Submitting counter-offer…" : "Confirming on Starknet…"}
              </p>
            </div>
          ) : step === "pin" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1.5">
                  <CurrencyIcon symbol={currencySymbol} size={14} />
                  <span className="font-mono font-semibold">{pendingValues?.price} {currencySymbol}</span>
                </div>
                <span className="text-muted-foreground text-xs truncate">
                  · {tokenName ?? "token"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your wallet PIN to sign the counter-offer on-chain.
              </p>
              <PinInput
                value={pin}
                onChange={(v) => { setPin(v); setPinError(null); }}
                error={pinError}
                autoFocus
              />
              {passkeySupported && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  disabled={isAuthenticatingPasskey || isProcessing}
                  onClick={handleUsePasskey}
                >
                  {isAuthenticatingPasskey ? "Authenticating passkey…" : "Use passkey instead"}
                </Button>
              )}
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
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Send counter-offer
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Gas is free. The counter creates a real on-chain order the buyer can accept.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentBid && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 text-sm">
                  <span className="text-muted-foreground">Current bid:</span>
                  <Badge variant="secondary">{currentBid}</Badge>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your counter price</FormLabel>
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
                            <CurrencyIcon symbol={currencySymbol} size={14} />
                            <span className="text-xs font-bold">{currencySymbol}</span>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid for</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-4 gap-2">
                            {DURATION_OPTIONS.map((opt) => (
                              <Button
                                key={opt.label}
                                type="button"
                                variant={field.value === opt.seconds ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(opt.seconds)}
                                disabled={isProcessing || opt.seconds < 3600}
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

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Message <span className="text-muted-foreground text-xs">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain your counter price to the buyer…"
                            className="resize-none"
                            rows={2}
                            maxLength={500}
                            disabled={isProcessing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
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
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {hasWallet ? "Send counter-offer" : "Set up wallet & counter"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Gas is free. Currency is locked to the buyer&apos;s original bid token.
                  </p>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <SessionSetupDialog
        open={sessionSetupOpen}
        onOpenChange={setSessionSetupOpen}
        onSetup={handleSessionSetup}
        isProcessing={isSettingUpSession}
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          if (!hasActiveSession) {
            setSessionSetupOpen(true);
          } else {
            setStep("pin");
          }
        }}
      />
    </>
  );
}
