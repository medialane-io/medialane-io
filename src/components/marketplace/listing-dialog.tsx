"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Tag, Layers, Zap, Info, ShieldCheck } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useAuth } from "@clerk/nextjs";
import { useMarketplace } from "@/hooks/use-marketplace";
import { useMarketplaceActionFlow } from "@/hooks/use-marketplace-action-flow";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import {
  MarketplacePinStep,
  MarketplaceProcessingState,
  MarketplaceActivatingSession,
  MarketplaceSignInGate,
  MarketplaceSuccessState,
  MarketplaceDialogHero,
  CurrencyPicker,
  DurationPicker,
} from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { parseFormPriceUsdc } from "@/lib/chipi/session-preferences";
import { getListableTokens } from "@medialane/sdk";
import { marketplacePriceField, marketplaceCurrencyField, marketplaceDurationField } from "@/lib/marketplace-schemas";
import { isWebAuthnSupported } from "@chipi-stack/nextjs";
import { usePasskeyAuth } from "@chipi-stack/chipi-passkey/hooks";
import { MarketplaceDebugPanel } from "@/components/marketplace/marketplace-debug-panel";

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
  const { tokenStandard: resolvedStandard } = useResolvedTokenStandard(assetContract, tokenStandard);
  const is1155 = resolvedStandard === "ERC1155";
  const standardResolved = resolvedStandard != null && resolvedStandard !== "UNKNOWN";
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
    debugSnapshot,
    resetState,
  } = useMarketplace();

  const [passkeySupported] = useState(
    () => typeof window !== "undefined" && isWebAuthnSupported()
  );
  const { authenticate, encryptKey } = usePasskeyAuth();

  const {
    walletSetupOpen,
    setWalletSetupOpen,
    pendingValues,
    pin,
    setPin,
    pinError,
    setPinError,
    step,
    setStep,
    isAuthenticatingPasskey,
    isActivatingSession,
    beginAction,
    handlePin,
    handleUsePasskey,
    resetActionFlow,
  } = useMarketplaceActionFlow<FormValues>({
    isSignedIn,
    hasWallet,
    hasActiveSession,
    setupSession,
    maybeClearSessionForAmountCap,
    authenticate,
    encryptKey,
    sessionRefreshTitle: "Large listing — fresh signing session",
    sessionRefreshDescription:
      "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
    executeAction: async (values, pinOrDerivedKey) => {
      await createListing({
        assetContract,
        tokenId,
        tokenName,
        price: values.price,
        currencySymbol: values.currency,
        durationSeconds: values.durationSeconds,
        tokenStandard: resolvedStandard,
        amount: is1155 ? (values.amount || "1") : undefined,
        pin: pinOrDerivedKey,
      });
    },
  });

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
    await beginAction(values, parseFormPriceUsdc(values.price));
  };

  const handleClose = (v: boolean) => { if (!isProcessing) onOpenChange(v); };

  useEffect(() => {
    if (open) { resetState(); form.reset(); resetActionFlow(); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isSuccess = !isProcessing && txStatus === "confirmed" && !error;
  const confettiFired = useRef(false);
  useEffect(() => {
    if (isSuccess && !confettiFired.current) { confettiFired.current = true; fireConfetti(); }
    if (!isSuccess) confettiFired.current = false;
  }, [isSuccess]);

  const name = tokenName || `Token #${tokenId}`;
  const shieldFooter = (
    <div className="flex items-start justify-center gap-1.5">
      <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-[10px] text-center text-muted-foreground">
        Listings are registered &amp; protected onchain via our permissionless protocol. Gas fees are sponsored by Medialane.
      </p>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
          <DialogTitle className="sr-only">List {name} for sale</DialogTitle>
          <DialogDescription className="sr-only">
            Set pricing, quantity, currency, and duration to create an onchain marketplace listing.
          </DialogDescription>

          {isSuccess ? (
            <MarketplaceSuccessState
              tokenImage={tokenImage}
              name={name}
              title="Listing live!"
              description={
                <>
                  <span className="font-medium text-foreground">{name}</span>{" "}
                  is now available for{" "}
                  <span className="font-semibold text-foreground">
                    {pendingValues?.price} {pendingValues?.currency}
                    {is1155 && pendingValues?.amount && pendingValues.amount !== "1"
                      ? ` × ${pendingValues.amount}` : ""}
                  </span>.
                </>
              }
              txHash={txHash}
              explorerUrl={EXPLORER_URL}
              onDone={() => { onOpenChange(false); onSuccess?.(); }}
              footer={<div className="w-full"><MarketplaceDebugPanel snapshot={debugSnapshot} /></div>}
            />

          ) : isActivatingSession ? (
            <MarketplaceActivatingSession />

          ) : isProcessing ? (
            <MarketplaceProcessingState
              title={txStatus === "submitting" ? "Submitting listing…" : "Confirming on Starknet…"}
              imageUrl={tokenImage}
              imageAlt={name}
            />

          ) : !isSignedIn ? (
            <MarketplaceSignInGate
              title="Sign in to list"
              description="You need a Medialane account to list assets for sale."
            />

          ) : step === "pin" ? (
            <>
              <MarketplaceDialogHero
                tokenImage={tokenImage}
                tokenName={tokenName}
                tokenId={tokenId}
                fallbackIcon={<Tag className="h-12 w-12 text-brand-blue/30" />}
                badge={is1155 ? (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/20 text-violet-300 backdrop-blur-sm">
                    <Layers className="h-3 w-3" />
                    Multi-edition
                  </span>
                ) : undefined}
              />
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
              <MarketplacePinStep
                description="Enter your PIN to sign this listing."
                pin={pin}
                onPinChange={(value) => { setPin(value); setPinError(null); }}
                pinError={pinError}
                error={error}
                secondaryLabel="Back"
                onSecondary={() => { setStep("form"); setPin(""); setPinError(null); }}
                primaryLabel="List for sale"
                onPrimary={handlePin}
                primaryDisabled={pin.length < 6}
                primaryIcon={<Tag className="h-4 w-4" />}
                passkeySupported={passkeySupported}
                isAuthenticatingPasskey={isAuthenticatingPasskey}
                onUsePasskey={handleUsePasskey}
                footer={shieldFooter}
              />
              <div className="px-6 pb-5">
                <MarketplaceDebugPanel snapshot={debugSnapshot} />
              </div>
            </>

          ) : (
            <>
              <MarketplaceDialogHero
                tokenImage={tokenImage}
                tokenName={tokenName}
                tokenId={tokenId}
                fallbackIcon={<Tag className="h-12 w-12 text-brand-blue/30" />}
                badge={is1155 ? (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-violet-500/40 bg-violet-500/20 text-violet-300 backdrop-blur-sm">
                    <Layers className="h-3 w-3" />
                    Multi-edition
                  </span>
                ) : undefined}
              />
              <div className="flex items-center justify-between px-6 pt-3 pb-1">
                <p className="font-bold text-base leading-tight truncate">{name}</p>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-5 pt-2 space-y-4">
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
                              <Input type="number" step="any" placeholder="0.00" className="pr-20" disabled={isProcessing} {...field} />
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
                            <CurrencyPicker
                              currencies={CURRENCIES}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isProcessing}
                            />
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
                            <DurationPicker
                              options={DURATION_OPTIONS}
                              value={field.value}
                              onChange={field.onChange}
                              disabled={isProcessing}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {error && (
                      <>
                        <MarketplaceDebugPanel snapshot={debugSnapshot} forceOpen />
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      </>
                    )}

                    <div className="pt-1 space-y-2">
                      <div className={`btn-border-animated p-[1px] rounded-xl ${(isProcessing || !standardResolved) ? "opacity-50 pointer-events-none" : ""}`}>
                        <button
                          type="submit"
                          className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                          disabled={isProcessing || !standardResolved}
                        >
                          <Tag className="h-4 w-4" />
                          {hasWallet ? "List for sale" : "Secure account & list"}
                        </button>
                      </div>
                      {shieldFooter}
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
