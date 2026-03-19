"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertCircle, Tag, ExternalLink, Loader2, LogIn, ArrowLeft } from "lucide-react";
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
import { SessionSetupDialog } from "@/components/chipi/session-setup-dialog";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useMarketplace } from "@/hooks/use-marketplace";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";

const CURRENCIES = ["USDC", "USDT", "STRK"] as const;

const schema = z.object({
  price: z.string().min(1, "Price required").refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    "Must be a positive number"
  ),
  currency: z.enum(CURRENCIES),
  durationSeconds: z.number().min(86400),
});

type FormValues = z.infer<typeof schema>;

interface ListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  onSuccess?: () => void;
}

export function ListingDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
  onSuccess,
}: ListingDialogProps) {
  const { isSignedIn } = useAuth();
  const {
    createListing,
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
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000 },
  });

  const onSubmit = (values: FormValues) => {
    if (!isSignedIn) return;
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    if (!hasActiveSession) {
      setSessionSetupOpen(true);
      return;
    }
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

  const handlePin = async () => {
    const err = validatePin(pin);
    if (err) { setPinError(err); return; }
    setPinError(null);
    if (!pendingValues) return;

    await createListing({
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

      await createListing({
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
              {step === "pin" ? "Confirm with PIN" : "List for sale"}
            </DialogTitle>
          </DialogHeader>

          {!isSignedIn ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <LogIn className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Sign in to list</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need a Medialane account to list assets for sale.
                </p>
              </div>
              <SignInButton mode="modal">
                <Button className="w-full">Sign in</Button>
              </SignInButton>
            </div>
          ) : isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold text-lg">Listing live!</p>
              <p className="text-sm text-muted-foreground text-center">
                {tokenName || `Token #${tokenId}`} is now available for{" "}
                {pendingValues?.price} {pendingValues?.currency}.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`${EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button className="w-full" onClick={() => {
                resetState();
                form.reset();
                setPendingValues(null);
                setStep("form");
                onOpenChange(false);
                onSuccess?.();
              }}>Done</Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting" ? "Submitting listing…" : "Confirming on Starknet…"}
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
                Enter your wallet PIN to sign the listing, or use passkey instead.
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
                  <Tag className="h-4 w-4 mr-2" />
                  List for sale
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground">
                Gas is free. Your PIN signs the listing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asset info */}
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
                        <FormLabel>Price</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              step="any"
                              placeholder="0.00"
                              className="pr-16"
                              disabled={isProcessing}
                              {...field}
                            />
                          </FormControl>
                          <div className="absolute right-3 top-2 text-xs font-bold">
                            {form.watch("currency")}
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
                          <div className="flex gap-2">
                            {CURRENCIES.map((c) => (
                              <Button
                                key={c}
                                type="button"
                                variant={field.value === c ? "default" : "outline"}
                                size="sm"
                                onClick={() => field.onChange(c)}
                                disabled={isProcessing}
                              >
                                {c}
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
                    <Tag className="h-4 w-4 mr-2" />
                    {hasWallet ? "List for sale" : "Set up wallet & list"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Gas is free. Your PIN signs the listing.
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
