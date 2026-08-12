"use client";

import { useForm } from "react-hook-form";
import { useUsdPrices } from "@/hooks/use-usd-prices";
import { usdValueFor } from "@/lib/wallet-format";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircle2, AlertCircle, ArrowLeftRight, ExternalLink, Loader2, Wallet } from "lucide-react";
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
import { useMarketplace } from "@/hooks/use-marketplace";
import { useWalletMarketplaceActionFlow } from "@/hooks/use-wallet-marketplace-action-flow";
import { CurrencyIcon } from "@/components/shared/currency-icon";
import { EXPLORER_URL, DURATION_OPTIONS } from "@/lib/constants";
import { marketplacePriceField, counterOfferDurationField } from "@/lib/marketplace-schemas";

/** Convert a human-readable amount string to raw wei integer string. */
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
  const { makeCounterOffer, hasWallet, resetState } = useMarketplace();

  const {
    pendingValues,
    status,
    txHash,
    error,
    beginAction,
    resetActionFlow,
  } = useWalletMarketplaceActionFlow<FormValues>({
    hasWallet,
    executeAction: async (values) => {
      const hash = await makeCounterOffer({
        originalOrderHash,
        counterPriceRaw: toRawWei(values.price, currencyDecimals),
        durationSeconds: values.durationSeconds,
        message: values.message || undefined,
        tokenName,
      });
      return hash ? { txHash: hash } : undefined;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", durationSeconds: 604800, message: "" },
  });

  const isProcessing = status === "processing" || status === "confirming";
  const usdPrices = useUsdPrices();
  const watchedPrice = form.watch("price");
  const usdEquivalent = usdValueFor(watchedPrice || undefined, currencySymbol, usdPrices);

  const onSubmit = (values: FormValues) => {
    if (!hasWallet) return;
    beginAction(values);
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      resetActionFlow();
      onOpenChange(v);
    }
  };

  const isSuccess = status === "success" && !error;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send a counter-offer</DialogTitle>
            {!isProcessing && !isSuccess && (
              <DialogDescription>
                Propose a different price to the buyer. Your NFT will be listed as a
                counter-offer — verifiable on-chain.
              </DialogDescription>
            )}
          </DialogHeader>

          {!hasWallet ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <Wallet className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-semibold">Secure your account to send a counter-offer</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need an account to counter bids.
                </p>
              </div>
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
              <p className="text-sm text-muted-foreground">Confirming onchain…</p>
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
                    {hasWallet ? "Send counter-offer" : "Set up account & counter"}
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
    </>
  );
}
