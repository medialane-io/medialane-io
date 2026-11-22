"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useUsdPrices } from "@medialane/ui/utils/use-usd-prices";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeftRight } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@medialane/ui/form";
import { Button } from "@medialane/ui/button";
import { Input } from "@medialane/ui/input";
import { Textarea } from "@medialane/ui/textarea";
import { MarketplaceDialog, DialogErrorAlert, DialogNote, DialogSignInGate } from "@/components/marketplace/dialog-frame";
import { Badge } from "@medialane/ui/badge";
import { MarketplaceDialogHero, TransactionDialogStates, successMessages, usdValueFor, DurationPicker, counterOfferFormSchema } from "@medialane/ui";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { makeCounterOffer } from "@/lib/marketplace-intents";
import { CurrencyIcon } from "@medialane/ui/currency-icon";
import { useDurationOptions } from "@/lib/use-duration-options";
import { useT } from "@medialane/ui/i18n";

function toRawWei(humanAmount: string, decimals: number): string {
  const parts = humanAmount.replace(/,/g, "").split(".");
  const integer = BigInt(parts[0] || "0");
  const fraction = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return (integer * BigInt(10 ** decimals) + BigInt(fraction)).toString();
}

type FormValues = z.infer<typeof counterOfferFormSchema>;

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
  const t = useT();
  const durationOptions = useDurationOptions();
  const { hasWallet } = useWalletNativeSession();
  const { phase, busy: isProcessing, txHash, error, start, reset } = useMarketplaceTransaction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(counterOfferFormSchema),
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
    <MarketplaceDialog
      open={open}
      onOpenChange={handleClose}
      title={t("Send a counter-offer")}
      description={t("Propose a different price to the buyer.")}
    >
      <TransactionDialogStates
        phase={phase}
        asset={{ name, image: tokenImage }}
        txHash={txHash}
        error={error}
        success={successMessages.countered({ name, price: `${pendingValues?.price} ${currencySymbol}` }, t)}
        errorTitle={t("Counter-offer failed")}
        errorDescription={t("The counter-offer did not complete.")}
        onRetry={reset}
        onDone={() => handleClose(false)}
      >
        {!hasWallet ? (
          <DialogSignInGate
            title={t("Secure your account to send a counter-offer")}
            description={t("You need an account to counter bids.")}
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
                    <span>{t("Current bid")}</span>
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
                        <FormLabel>{t("Your counter price")}</FormLabel>
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
                        <FormLabel>{t("Valid for")}</FormLabel>
                        <FormControl>
                          <DurationPicker
                            options={durationOptions}
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
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {t("Message")} <span className="text-muted-foreground text-xs">{t("(optional)")}</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("Explain your counter price to the buyer…")}
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

                  <DialogErrorAlert error={error} />

                  <Button type="submit" className="w-full h-11" disabled={isProcessing}>
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    {t("Send counter-offer")}
                  </Button>
                  <DialogNote>{t("This offer will be recorded onchain.")}</DialogNote>
                </form>
              </Form>
            </div>
          </>
        )}
      </TransactionDialogStates>
    </MarketplaceDialog>
  );
}
