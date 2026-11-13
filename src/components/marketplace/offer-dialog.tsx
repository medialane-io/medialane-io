"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSWRConfig } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, AlertTriangle, HandCoins, Layers, ShieldCheck } from "lucide-react";
import { useConfetti } from "@medialane/ui/utils/use-confetti";
import { RewardEarned, usdValueFor } from "@medialane/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { Form } from "@medialane/ui/form";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useOnOpen } from "@medialane/ui/utils/use-on-open";
import { makeOffer } from "@/lib/marketplace-intents";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import {
  TransactionDialogStates,
  MarketplaceSignInGate,
  successMessages,
  MarketplaceDialogHero,
  OrderFields,
  GradientButton,
  orderFormSchema,
  type OrderFormValues,
} from "@medialane/ui";
import { DURATION_OPTIONS } from "@/lib/constants";
import { resolveImage } from "@/lib/utils";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useTokenBalance, hasSufficientBalance } from "@medialane/ui/utils/media-wallet/use-erc20-balance";
import { useUsdPrices } from "@medialane/ui/utils/use-usd-prices";

type FormValues = OrderFormValues;

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
  tokenImage: tokenImageRaw,
  tokenStandard,
}: OfferDialogProps) {
  const pathname = usePathname();
  const tokenImage = resolveImage(tokenImageRaw);
  const { tokenStandard: resolvedStandard } = useResolvedTokenStandard(assetContract, tokenStandard);
  const is1155 = resolvedStandard === "ERC1155";
  const { mutate } = useSWRConfig();
  const { phase, busy, txHash, error, retryable, failedAfterSubmit, start, reset } = useMarketplaceTransaction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000, amount: "1" },
  });

  const { address: walletAddress, hasWallet } = useWalletNativeSession();
  const watchedCurrency = form.watch("currency");
  const watchedPrice = form.watch("price");
  const watchedQty = form.watch("amount");
  const { rawBalance, decimals } = useTokenBalance(open ? watchedCurrency : null,
    open ? walletAddress : null
  );
  const totalRequired = (() => {
    const qty = parseFloat(watchedQty || "1");
    const price = parseFloat(watchedPrice || "0");
    if (isNaN(qty) || isNaN(price) || price <= 0) return "";
    return (qty * price).toFixed(decimals <= 6 ? 6 : 18);
  })();
  const balanceSufficient = hasSufficientBalance(rawBalance, totalRequired, decimals);
  const usdPrices = useUsdPrices();
  const usdEquivalent = usdValueFor(totalRequired || undefined, watchedCurrency, usdPrices);

  const onSubmit = (values: FormValues) => {
    if (!hasWallet) return;
    setPendingValues(values);
    void start((ctx) => makeOffer(ctx, {
      assetContract,
      tokenId,
      price: values.price,
      currencySymbol: values.currency,
      durationSeconds: values.durationSeconds,
      tokenStandard: resolvedStandard,
      quantity: values.amount,
    }));
  };

  const isSuccess = phase === "success";

  const handleClose = (v: boolean) => {
    if (!busy && !isSuccess && !failedAfterSubmit) onOpenChange(v);
  };

  useOnOpen(open, () => { form.reset(); reset(); setPendingValues(null); });

  useConfetti(isSuccess);
  useEffect(() => {
    if (!isSuccess) return;
    mutate((key) => typeof key === "string" && key.includes("/v1/orders"), undefined, { revalidate: true });
  }, [isSuccess, mutate]);

  const name = tokenName || `Token #${tokenId}`;
  const shieldFooter = (
    <div className="flex items-start justify-center gap-1.5">
      <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-2xs text-center text-muted-foreground">
        Offers are fully onchain and permissionless. Funds are escrowed until the trade settles.
      </p>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl flex flex-col max-h-[92svh]">
          <DialogTitle className="sr-only">Make an offer on {name}</DialogTitle>
          <DialogDescription className="sr-only">
            Set your offer price, currency, and duration to place an onchain offer.
          </DialogDescription>

          <TransactionDialogStates
            phase={phase}
            asset={{ name, image: tokenImage }}
            statusMessage="Confirming on Starknet…"
            txHash={txHash}
            error={error}
            success={successMessages.offered({ name, price: `${pendingValues?.price} ${pendingValues?.currency}` })}
            successActions={[{ label: "Done", onClick: () => onOpenChange(false) }]}
            successChildren={<RewardEarned actionType="make_offer" />}
            errorTitle="Offer failed"
            errorDescription="The transaction was submitted, but the offer could not be completed."
            onRetry={retryable ? reset : undefined}
            onDone={() => onOpenChange(false)}
          >
            {!hasWallet ? (
              <MarketplaceSignInGate
                title="Secure your account to make an offer"
                description="You need an account to place offers."
                href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}
              />

            ) : (
              <>
                <MarketplaceDialogHero
                  tokenImage={tokenImage}
                  tokenName={tokenName}
                  tokenId={tokenId}
                  fallbackIcon={<HandCoins className="h-12 w-12 text-brand-blue/30" />}
                  badge={is1155 ? (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-2xs font-semibold px-2.5 py-1 rounded-full border border-brand-purple/40 bg-brand-purple/20 text-brand-purple backdrop-blur-sm">
                      <Layers className="h-3 w-3" />
                      Multi-edition
                    </span>
                  ) : undefined}
                />
                <div className="flex items-center justify-between px-5 pt-3 pb-0">
                  <p className="font-bold text-base leading-tight truncate">{name}</p>
                </div>

                <div className="px-5 pb-4 pt-2 space-y-3">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

                      <OrderFields
                        form={form}
                        durationOptions={DURATION_OPTIONS}
                        busy={busy}
                        priceLabel={is1155 ? "Price per edition" : "Offer price"}
                        quantity={is1155 ? {} : undefined}
                      />

                      {usdEquivalent && (
                        <p className="text-xs text-muted-foreground -mt-1">≈ {usdEquivalent}</p>
                      )}

                      {balanceSufficient === false && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-600 dark:text-amber-400 leading-snug">
                            Your {watchedCurrency} balance may be insufficient for this offer. You can still submit — the payment is only charged when the offer is accepted.
                          </p>
                        </div>
                      )}

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="pt-1 space-y-2">
                        <GradientButton type="submit" disabled={busy}>
                          <HandCoins className="h-4 w-4" />
                          {hasWallet ? "Submit offer" : "Secure account & offer"}
                        </GradientButton>
                        {shieldFooter}
                      </div>

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
