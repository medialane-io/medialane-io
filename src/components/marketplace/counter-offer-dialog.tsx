"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@medialane/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@medialane/ui/form";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { Textarea } from "@medialane/ui/textarea";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { Badge } from "@medialane/ui/badge";
import { MarketplaceDialogHero, MarketplaceSignInGate, TransactionDialogStates, successMessages, usdValueFor } from "@medialane/ui";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { makeCounterOffer } from "@/lib/marketplace-intents";
import { CurrencyIcon } from "@medialane/ui/currency-icon";
import { DURATION_OPTIONS } from "@/lib/constants";
import { marketplacePriceField, counterOfferDurationField } from "@/lib/marketplace-schemas";

function toRawWei(humanAmount: string, decimals: number): string {
  const parts = humanAmount.replace(/,/g, "").split(".");
  const integer = BigInt(parts[0] || "0");
  const fraction = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return (integer * BigInt(10 ** decimals) + BigInt(fraction)).toString();
}

const schema = z.object({
  price: marketplacePriceField,
  durationSeconds: counterOfferDurationField,
  message: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalOrderHash: string;
  tokenName?: string;
  tokenImage?: string | null;
  tokenId?: string;
  currentBid?: string;
  currencySymbol: string;
  currencyDecimals: number;
}

export function CounterOfferDialog({
  open,
  onOpenChange,
  originalOrderHash,
  tokenName,
  tokenImage,
  tokenId,
  currentBid,
  currencySymbol,
  currencyDecimals,
}: CounterOfferDialogProps) {
  const pathname = usePathname();
  const { hasWallet } = useWalletNativeSession();
  const { phase, busy: isProcessing, txHash, error, start, reset } = useMarketplaceTransaction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", durationSeconds: 604800, message: "" },
  });

  const usdPrices = useUsdPrices();
  const watchedPrice = form.watch("price");
  const usdEquivalent = usdValueFor(watchedPrice || undefined, currencySymbol, usdPrices);

  const onSubmit = (values: FormValues) => {
    if (!hasWallet) return;
    setPendingValues(values);
    void start((ctx) => makeCounterOffer(ctx, {
      originalOrderHash,
      counterPriceRaw: toRawWei(values.price, currencyDecimals),
      durationSeconds: values.durationSeconds,
      message: values.message || undefined,
    }));
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      form.reset();
      reset();
      setPendingValues(null);
      onOpenChange(v);
    }
  };

  const name = tokenName || "this token";

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
          <DialogTitle className="sr-only">Send a counter-offer</DialogTitle>
          <DialogDescription className="sr-only">
            Propose a different price to the buyer. Your NFT will be listed as a counter-offer, verifiable onchain.
          </DialogDescription>

          <TransactionDialogStates
            phase={phase}
            asset={{ name, image: tokenImage }}
            txHash={txHash}
            error={error}
            success={successMessages.countered({ name, price: `${pendingValues?.price} ${currencySymbol}` })}
            errorTitle="Counter-offer failed"
            errorDescription="The transaction was submitted, but the counter-offer could not be completed."
            onRetry={reset}
            onDone={() => handleClose(false)}
          >
            {!hasWallet ? (
              <MarketplaceSignInGate
                title="Secure your account to send a counter-offer"
                description="You need an account to counter bids."
                href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}
              />
            ) : (
              <>
                <MarketplaceDialogHero
                  tokenImage={tokenImage}
                  tokenName={tokenName}
                  tokenId={tokenId ?? ""}
                  fallbackIcon={<ArrowLeftRight className="h-12 w-12 text-brand-blue/30" />}
                />
                <div className="px-5 pb-5 pt-3 space-y-4">
                  <div className="min-w-0">
                    <p className="font-bold text-base leading-tight truncate">{name}</p>
                    {currentBid && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Current bid</span>
                        <Badge variant="secondary">{currentBid}</Badge>
                      </div>
                    )}
                  </div>

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
                            {usdEquivalent && (
                              <p className="text-xs text-muted-foreground">≈ {usdEquivalent}</p>
                            )}
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
                        {hasWallet ? "Send counter-offer" : "Connect with email to counter"}
                      </Button>
                      <p className="text-2xs text-center text-muted-foreground">
                        Your offer will be pushed onchain. Transaction sponsored by Medialane.
                      </p>
                    </form>
                  </Form>
                </div>
              </>
            )}
          </TransactionDialogStates>
        </DialogContent>
      </Dialog>
    </>
  );
}
