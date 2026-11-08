"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSWRConfig } from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Tag, Layers, ShieldCheck, Loader2 } from "lucide-react";
import { CurrencyIcon } from "@medialane/ui/currency-icon";
import { useConfetti } from "@medialane/ui/utils/use-confetti";
import { RewardEarned } from "@medialane/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@medialane/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@medialane/ui/form";
import { Input } from "@medialane/ui/input";
import { Alert, AlertDescription } from "@medialane/ui/alert";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useOnOpen } from "@medialane/ui/utils/use-on-open";
import { createListing } from "@/lib/marketplace-intents";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import {
  TransactionDialogStates,
  MarketplaceSignInGate,
  successMessages,
  MarketplaceDialogHero,
  CurrencyPicker,
  DurationPicker,
} from "@medialane/ui";
import { DURATION_OPTIONS } from "@/lib/constants";
import { resolveImage } from "@/lib/utils";
import { getListableTokens } from "@medialane/sdk";
import { marketplacePriceField, marketplaceCurrencyField, marketplaceDurationField } from "@/lib/marketplace-schemas";

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
  quantityOwned?: number;
  onSuccess?: () => void;
}

export function ListingDialog({
  open,
  onOpenChange,
  assetContract,
  tokenId,
  tokenName,
  tokenStandard,
  tokenImage: tokenImageRaw,
  quantityOwned,
  onSuccess,
}: ListingDialogProps) {
  const pathname = usePathname();
  const tokenImage = resolveImage(tokenImageRaw);
  const { tokenStandard: resolvedStandard, isResolving } = useResolvedTokenStandard(assetContract, tokenStandard);
  const is1155 = resolvedStandard === "ERC1155";
  const { mutate } = useSWRConfig();
  const { hasWallet } = useWalletNativeSession();
  const { phase, busy, txHash, error, retryable, failedAfterSubmit, start, reset } = useMarketplaceTransaction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 2592000, amount: "1" },
  });

  const onSubmit = (values: FormValues) => {
    if (!hasWallet) return;
    if (is1155) {
      const qty = parseInt(values.amount ?? "", 10);
      if (!values.amount || isNaN(qty) || qty < 1) {
        form.setError("amount", { message: "Enter a quantity of at least 1" });
        return;
      }
    }
    setPendingValues(values);
    void start((ctx) => createListing(ctx, {
      assetContract,
      tokenId,
      price: values.price,
      currencySymbol: values.currency,
      durationSeconds: values.durationSeconds,
      tokenStandard: resolvedStandard,
      amount: is1155 ? (values.amount || "1") : undefined,
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
    mutate((key) => typeof key === "string" && key.includes("/v1/tokens/"), undefined, { revalidate: true });
  }, [isSuccess, mutate]);

  const name = tokenName || `Token #${tokenId}`;
  const listedPrice = `${pendingValues?.price} ${pendingValues?.currency}${is1155 && pendingValues?.amount && pendingValues.amount !== "1" ? ` × ${pendingValues.amount}` : ""}`;
  const shieldFooter = (
    <div className="flex items-start justify-center gap-1.5">
      <ShieldCheck className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-2xs text-center text-muted-foreground">
        Listings are fully onchain and permissionless. Assets stay in the wallet until a trade settles.
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

          <TransactionDialogStates
            phase={phase}
            asset={{ name, image: tokenImage }}
            txHash={txHash}
            error={error}
            success={successMessages.listed({ name, price: listedPrice })}
            successActions={[{ label: "Done", onClick: () => { onOpenChange(false); onSuccess?.(); } }]}
            successChildren={<RewardEarned actionType="list_asset" />}
            errorTitle="Listing failed"
            errorDescription="The transaction was submitted, but the listing could not be completed."
            onRetry={retryable ? reset : undefined}
            onDone={() => onOpenChange(false)}
          >
            {!hasWallet ? (
              <MarketplaceSignInGate
                title="Secure your account to list"
                description="You need an account to list assets for sale."
                href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}
              />

            ) : (
              <>
                <MarketplaceDialogHero
                  tokenImage={tokenImage}
                  tokenName={tokenName}
                  tokenId={tokenId}
                  fallbackIcon={<Tag className="h-12 w-12 text-brand-blue/30" />}
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

                      {is1155 ? (
                        <div className="grid grid-cols-2 gap-3 items-start">
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between">
                                  <FormLabel>Qty</FormLabel>
                                  {quantityOwned != null && (
                                    <span className="text-xs text-muted-foreground">You own {quantityOwned}</span>
                                  )}
                                </div>
                                <FormControl>
                                  <Input type="number" min="1" step="1" placeholder="1" disabled={busy} {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price / edition</FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input type="number" step="any" placeholder="0.00" className="pr-16" disabled={busy} {...field} />
                                  </FormControl>
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                                    <CurrencyIcon symbol={form.watch("currency")} size={13} />
                                    <span className="text-2xs font-bold">{form.watch("currency")}</span>
                                  </div>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : (
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input type="number" step="any" placeholder="0.00" className="pr-20" disabled={busy} {...field} />
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
                                disabled={busy}
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
                                disabled={busy}
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
                        <div className={`btn-border-animated p-[1px] rounded-xl ${(busy || isResolving) ? "pointer-events-none" : ""}`}>
                          <button
                            type="submit"
                            className="w-full h-11 rounded-[11px] flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] bg-transparent"
                            disabled={busy || isResolving}
                          >
                            {isResolving ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Resolving asset…</>
                            ) : (
                              <><Tag className="h-4 w-4" /> {hasWallet ? "List" : "Secure account & list"}</>
                            )}
                          </button>
                        </div>
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
