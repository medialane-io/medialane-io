"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, HandCoins, Zap } from "lucide-react";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { fireConfetti } from "@/lib/confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const CURRENCIES = getListableTokens().map((t) => t.symbol);

const schema = z.object({
  price: marketplacePriceField,
  currency: marketplaceCurrencyField,
  durationSeconds: marketplaceDurationField,
  quantity: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetContract: string;
  tokenId: string;
  tokenName?: string;
  tokenImage?: string;
  tokenStandard?: "ERC721" | "ERC1155" | "UNKNOWN";
}

export function OfferDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
  tokenImage,
  tokenStandard,
}: OfferDialogProps) {
  const { tokenStandard: resolvedStandard } = useResolvedTokenStandard(assetContract, tokenStandard);
  const is1155 = resolvedStandard === "ERC1155";
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
    sessionRefreshTitle: "Large offer — fresh signing session",
    sessionRefreshDescription:
      "Your saved session was cleared for this transaction size. A new session will be activated automatically.",
    executeAction: async (values, pinOrDerivedKey) => {
      await makeOffer({
        assetContract,
        tokenId,
        tokenName,
        price: values.price,
        currencySymbol: values.currency,
        durationSeconds: values.durationSeconds,
        tokenStandard: resolvedStandard,
        quantity: values.quantity,
        pin: pinOrDerivedKey,
      });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000, quantity: "1" },
  });

  const onSubmit = async (values: FormValues) => {
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">

          {isSuccess ? (
            <MarketplaceSuccessState
              tokenImage={tokenImage}
              name={name}
              title="Offer live!"
              description={
                <>
                  Your offer of{" "}
                  <span className="font-medium text-foreground">
                    {pendingValues?.price} {pendingValues?.currency}
                  </span>{" "}
                  on {name} is now active.
                </>
              }
              txHash={txHash}
              explorerUrl={EXPLORER_URL}
              onDone={() => onOpenChange(false)}
            />

          ) : isActivatingSession ? (
            <MarketplaceActivatingSession />

          ) : isProcessing ? (
            <MarketplaceProcessingState
              title={txStatus === "submitting" ? "Submitting offer…" : "Confirming on Starknet…"}
              imageUrl={tokenImage}
              imageAlt={name}
            />

          ) : !isSignedIn ? (
            <MarketplaceSignInGate
              title="Sign in to make an offer"
              description="You need a Medialane account to place offers."
            />

          ) : step === "pin" ? (
            <>
              <MarketplaceDialogHero
                tokenImage={tokenImage}
                tokenName={tokenName}
                tokenId={tokenId}
                fallbackIcon={<HandCoins className="h-12 w-12 text-brand-blue/30" />}
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
                </div>
              </div>
              <MarketplacePinStep
                description="Enter your PIN to sign the offer."
                pin={pin}
                onPinChange={(value) => { setPin(value); setPinError(null); }}
                pinError={pinError}
                error={error}
                secondaryLabel="Back"
                onSecondary={() => { setStep("form"); setPin(""); setPinError(null); }}
                primaryLabel="Send offer"
                onPrimary={handlePin}
                primaryDisabled={pin.length < 6}
                primaryIcon={<HandCoins className="h-4 w-4" />}
                passkeySupported={passkeySupported}
                isAuthenticatingPasskey={isAuthenticatingPasskey}
                onUsePasskey={handleUsePasskey}
                footer={(
                  <p className="text-[10px] text-center text-muted-foreground">
                    Transaction gas fees are sponsored by Medialane.
                  </p>
                )}
              />
            </>

          ) : (
            <>
              <MarketplaceDialogHero
                tokenImage={tokenImage}
                tokenName={tokenName}
                tokenId={tokenId}
                fallbackIcon={<HandCoins className="h-12 w-12 text-brand-blue/30" />}
              />
              <div className="flex items-center justify-between px-6 pt-3 pb-1">
                <div className="min-w-0">
                  <p className="font-bold text-base leading-tight truncate">{name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">#{tokenId}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-5 pt-2 space-y-4">
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

                    {is1155 && (
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" step="1" placeholder="1" disabled={isProcessing} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="pt-1 space-y-2">
                      <div className={`btn-border-animated p-[1px] rounded-xl ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}>
                        <button
                          type="submit"
                          disabled={isProcessing}
                          className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-background/30"
                        >
                          <HandCoins className="h-4 w-4" />
                          {hasWallet ? "Submit offer" : "Secure account & offer"}
                        </button>
                      </div>
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
