"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tag, Layers, Loader2 } from "lucide-react";
import { useConfetti } from "@medialane/ui/utils/use-confetti";
import { RewardEarned } from "@medialane/ui";
import { Form } from "@medialane/ui/form";
import { MarketplaceDialog, DialogErrorAlert, DialogSignInGate, DialogNote } from "@/components/marketplace/dialog-frame";
import { useMarketplaceTransaction } from "@/hooks/use-marketplace-transaction";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useOnOpen } from "@medialane/ui/utils/use-on-open";
import { createListing } from "@/lib/marketplace-intents";
import { useResolvedTokenStandard } from "@/hooks/use-resolved-token-standard";
import {
  TransactionDialogStates,
  successMessages,
  ListingAssetSummary,
  OrderFields,
  GradientButton,
  orderFormSchema,
  type OrderFormValues,
} from "@medialane/ui";
import { DURATION_OPTIONS } from "@/lib/constants";
import { resolveImage } from "@/lib/utils";

type FormValues = OrderFormValues;

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
  const tokenImage = resolveImage(tokenImageRaw);
  const { tokenStandard: resolvedStandard, isResolving } = useResolvedTokenStandard(assetContract, tokenStandard);
  const is1155 = resolvedStandard === "ERC1155";
  const { hasWallet } = useWalletNativeSession();
  const { phase, busy, txHash, error, retryable, failedAfterSubmit, start, reset } = useMarketplaceTransaction();
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { price: "", currency: "USDC", durationSeconds: 63072000, amount: "1" },
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

  const name = tokenName || `Token #${tokenId}`;
  const listedPrice = `${pendingValues?.price} ${pendingValues?.currency}${is1155 && pendingValues?.amount && pendingValues.amount !== "1" ? ` × ${pendingValues.amount}` : ""}`;

  return (
    <MarketplaceDialog
      open={open}
      onOpenChange={handleClose}
      title={`Sell ${name}`}
      description="Set pricing, quantity, currency, and duration to create an onchain marketplace listing."
    >
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
          <DialogSignInGate
            title="Secure your account to sell"
            description="You need an account to sell assets."
          />

        ) : (
          <>
            <ListingAssetSummary
              name={name}
              image={tokenImage}
              fallbackIcon={<Tag className="h-6 w-6 text-brand-blue/40" />}
              badge={is1155 ? (
                <span className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-full border border-brand-purple/40 bg-brand-purple/15 text-brand-purple">
                  <Layers className="h-3 w-3" />
                  Multi-edition
                </span>
              ) : undefined}
            />

            <div className="px-5 pb-5 pt-4 overflow-y-auto">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  <OrderFields
                    form={form}
                    durationOptions={DURATION_OPTIONS}
                    busy={busy}
                    priceLabel={is1155 ? "Price per edition" : "Price"}
                    quantity={is1155 ? { owned: quantityOwned } : undefined}
                  />

                  <DialogErrorAlert error={error} />

                  <div className="pt-1 space-y-2">
                    <GradientButton type="submit" disabled={busy || isResolving}>
                      {isResolving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Resolving asset…</>
                      ) : (
                        <><Tag className="h-4 w-4" /> Sell</>
                      )}
                    </GradientButton>
                    <DialogNote>Listings are fully onchain and permissionless. Assets stay in the wallet until it settles.</DialogNote>
                  </div>

                </form>
              </Form>
            </div>
          </>
        )}
      </TransactionDialogStates>
    </MarketplaceDialog>
  );
}
