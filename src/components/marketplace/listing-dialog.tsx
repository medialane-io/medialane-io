"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2, AlertCircle, Tag, ExternalLink, Loader2,
  LogIn, ArrowLeft, Sparkles, Layers, Zap, Info,
} from "lucide-react";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PinInput, validatePin } from "@/components/ui/pin-input";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useCollection } from "@/hooks/use-collections";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { parseFormPriceUsdc } from "@/lib/chipi/session-preferences";
import { getListableTokens } from "@medialane/sdk";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { marketplacePriceField, marketplaceCurrencyField, marketplaceDurationField } from "@/lib/marketplace-schemas";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

const CURRENCIES = getListableTokens().map((t) => t.symbol);

const schema = z.object({
  price: marketplacePriceField,
  currency: marketplaceCurrencyField,
  durationSeconds: marketplaceDurationField,
  amount: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
  tokenImage?: string | null;
  onSuccess?: () => void;
}

// ── Hero image strip shared by form + pin steps ──────────────────────────────
function ListingHero({
  tokenImage,
  tokenName,
  tokenId,
  is1155,
}: {
  tokenImage?: string | null;
  tokenName?: string;
  tokenId: string;
  is1155: boolean;
}) {
  const name = tokenName || `Token #${tokenId}`;
  return (
    <div className="relative h-44 w-full bg-muted overflow-hidden shrink-0">
      {tokenImage ? (
        <img src={tokenImage} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand-blue/20 via-brand-purple/10 to-transparent flex items-center justify-center">
          <Tag className="h-12 w-12 text-brand-blue/30" />
        </div>
      )}
      {/* Fade into dialog bg */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      {/* Badges */}
      {is1155 && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/20 text-violet-300 backdrop-blur-sm">
          <Layers className="h-3 w-3" />
          Multi-edition
        </span>
      )}
    </div>
  );
}

export function ListingDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
  tokenStandard,
  tokenImage,
  onSuccess,
}: ListingDialogProps) {
  const { collection } = useCollection(tokenStandard == null ? assetContract : null);
  const resolvedStandard = tokenStandard ?? collection?.standard;
  const is1155 = resolvedStandard === "ERC1155";
  const standardResolved = resolvedStandard != null;
  const { isSignedIn } = useAuth();
  const {
    createListing,
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
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000, amount: "1" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!isSignedIn) return;
    if (is1155) {
      const qty = parseInt(values.amount ?? "", 10);
      if (!values.amount || isNaN(qty) || qty < 1) {
        form.setError("amount", { message: "Enter a quantity of at least 1" });
        return;
      }
    }
    setPendingValues(values);
    if (!hasWallet) { setWalletSetupOpen(true); return; }
    const priceUsdc = parseFormPriceUsdc(values.price);
    const cleared = await maybeClearSessionForAmountCap(priceUsdc);
    if (cleared) {
      toast.info("Large listing — fresh signing session", {
        description: "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
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

    await createListing({
      assetContract, tokenId, tokenName,
      price: pendingValues.price,
      currencySymbol: pendingValues.currency,
      durationSeconds: pendingValues.durationSeconds,
      tokenStandard,
      amount: is1155 ? (pendingValues.amount || "1") : undefined,
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
      if (!hasActiveSession) await setupSession(derived);
      await createListing({
        assetContract, tokenId, tokenName,
        price: pendingValues.price,
        currencySymbol: pendingValues.currency,
        durationSeconds: pendingValues.durationSeconds,
        tokenStandard,
        amount: is1155 ? (pendingValues.amount || "1") : undefined,
        pin: derived,
      });
      setPin("");
      setStep("form");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Passkey authentication failed";
      toast.error("Passkey authentication failed", { description: msg });
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };

  const handleClose = (v: boolean) => { if (!isProcessing) onOpenChange(v); };

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
    if (isSuccess && !confettiFired.current) { confettiFired.current = true; fireConfetti(); }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

  const name = tokenName || `Token #${tokenId}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0 flex flex-col max-h-[92svh]">

          {/* ── Success ─────────────────────────────────────────────────── */}
          {isSuccess ? (
            <div className="flex flex-col items-center gap-5 p-6 py-8">
              {tokenImage ? (
                <div className="relative">
                  <div className="h-32 w-32 rounded-2xl overflow-hidden border border-border shadow-lg">
                    <img src={tokenImage} alt={name} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg border-2 border-background">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-400" />
                </div>
              ) : (
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400" />
                </div>
              )}
              <div className="text-center space-y-1">
                <p className="font-bold text-xl">Listing live!</p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{name}</span>{" "}
                  is now available for{" "}
                  <span className="font-semibold text-foreground">
                    {pendingValues?.price} {pendingValues?.currency}
                    {is1155 && pendingValues?.amount && pendingValues.amount !== "1"
                      ? ` × ${pendingValues.amount}` : ""}
                  </span>.
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
              <Button className="w-full h-11" onClick={() => { onOpenChange(false); onSuccess?.(); }}>
                Done
              </Button>
            </div>

          ) : isActivatingSession ? (
            <div className="flex flex-col items-center gap-4 p-6 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Activating wallet session…</p>
            </div>

          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-5 p-6 py-8">
              {tokenImage ? (
                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border border-border shadow-md">
                  <img src={tokenImage} alt={name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                </div>
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              )}
              <div className="text-center space-y-1">
                <p className="font-semibold">
                  {txStatus === "submitting" ? "Submitting listing…" : "Confirming on Starknet…"}
                </p>
                <p className="text-sm text-muted-foreground">Please wait, do not close this window.</p>
              </div>
            </div>

          ) : !isSignedIn ? (
            <div className="flex flex-col items-center gap-4 p-6 py-10 text-center">
              <LogIn className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Sign in to list</p>
                <p className="text-sm text-muted-foreground mt-1">You need a Medialane account to list assets for sale.</p>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full">Sign in</Button>
              </SignInButton>
            </div>

          ) : step === "pin" ? (
            <>
              {/* Hero */}
              <ListingHero tokenImage={tokenImage} tokenName={tokenName} tokenId={tokenId} is1155={is1155} />

              {/* Name + listing summary */}
              <div className="flex items-end justify-between px-6 pt-3 pb-1">
                <div className="min-w-0">
                  <p className="font-bold text-lg leading-tight truncate">{name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Zap className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] font-medium text-emerald-500">Gasless · Starknet</span>
                  </div>
                </div>
                <div className="shrink-0 text-right ml-4">
                  <p className="font-bold text-xl leading-tight">
                    {pendingValues?.price}{" "}
                    <span className="text-sm font-normal text-muted-foreground">{pendingValues?.currency}</span>
                  </p>
                  {is1155 && pendingValues?.amount && pendingValues.amount !== "1" && (
                    <p className="text-xs text-muted-foreground">×{pendingValues.amount} editions</p>
                  )}
                </div>
              </div>

              {/* PIN entry */}
              <div className="px-6 pb-6 pt-3 space-y-4">
                <p className="text-sm text-muted-foreground">Enter your PIN to sign this listing.</p>
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
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => { setStep("form"); setPin(""); setPinError(null); }}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  <Button
                    className="flex-1 h-11 bg-brand-blue hover:brightness-110 text-white"
                    disabled={pin.length < 6}
                    onClick={handlePin}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    List for sale
                  </Button>
                </div>
                {passkeySupported && (
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    disabled={isAuthenticatingPasskey}
                    onClick={handleUsePasskey}
                  >
                    {isAuthenticatingPasskey
                      ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Authenticating…</>
                      : "Use passkey instead"}
                  </Button>
                )}
                <p className="text-[10px] text-center text-muted-foreground">
                  Transaction gas fees are sponsored by Medialane.
                </p>
              </div>
            </>

          ) : (
            /* ── Form step ─────────────────────────────────────────────── */
            <>
              {/* Hero */}
              <ListingHero tokenImage={tokenImage} tokenName={tokenName} tokenId={tokenId} is1155={is1155} />

              {/* Name row */}
              <div className="flex items-center justify-between px-6 pt-3 pb-1">
                <div className="min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">#{tokenId}</Badge>
                  </div>
                </div>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto px-6 pb-5 pt-2 space-y-4">

                {/* ERC-1155 explainer */}
                {is1155 && (
                  <div className="flex gap-2.5 p-3 rounded-xl bg-violet-500/8 border border-violet-500/20">
                    <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-semibold text-violet-400">Listing editions</p>
                      <p>Set a <span className="font-medium text-foreground">quantity</span> and <span className="font-medium text-foreground">price per unit</span> — buyers can purchase copies at that fixed price.</p>
                    </div>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    {is1155 && (
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity to list</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="1" placeholder="1" disabled={isProcessing} className="max-w-[140px]" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{is1155 ? "Price per edition" : "Price"}</FormLabel>
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

                    <div className="pt-1 space-y-2">
                      <Button type="submit" className="w-full h-11 bg-brand-blue hover:brightness-110 text-white" disabled={isProcessing || !standardResolved}>
                        <Tag className="h-4 w-4 mr-2" />
                        {hasWallet ? "List for sale" : "Secure account & list"}
                      </Button>
                      <p className="text-[10px] text-center text-muted-foreground">
                        Transaction gas fees are sponsored by Medialane.
                      </p>
                    </div>

                  </form>
                </Form>
              </div>
            </>
          )}

        </DialogContent>
      </Dialog>

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => { setWalletSetupOpen(false); setStep("pin"); }}
      />
    </>
  );
}
