"use client";

import { Loader2, CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { MarketplaceErrorState, MarketplaceSuccessState } from "@/components/marketplace/marketplace-dialog-primitives";
import { EXPLORER_URL } from "@/lib/constants";
import { useDropMintStatus, type DropConditions } from "@/hooks/use-drops";
import { getListableTokens, normalizeAddress } from "@medialane/sdk";
import { buildFeeCall, type StarknetVenueSigner } from "@medialane/sdk/starknet";
import { ioFeeConfig } from "@/lib/fee";
import { rewardToast } from "@/lib/reward-toast";

interface CollectionDropMintButtonProps {
  collectionAddress: string;
  conditions?: DropConditions;
}

// 10,000 tokens at 18 decimals — any drop priced above this is almost certainly
// a tampered API response. Prevents unlimited ERC-20 approval from a bad backend.
const MAX_APPROVAL_AMOUNT = 10_000n * 10n ** 18n;

function getPriceBigInt(conditions?: DropConditions): bigint {
  if (!conditions || conditions.price === "0" || conditions.paymentToken === "0x0") return 0n;
  try {
    const price = BigInt(conditions.price);
    if (price > MAX_APPROVAL_AMOUNT) {
      console.error("[drop-mint] price exceeds sanity cap — possible API tampering", conditions.price);
      return 0n;
    }
    return price;
  } catch {
    return 0n;
  }
}

function u256CallData(value: bigint): [string, string] {
  const low  = (value & BigInt("0xffffffffffffffffffffffffffffffff")).toString();
  const high = (value >> 128n).toString();
  return [low, high];
}

export function CollectionDropMintButton({
  collectionAddress,
  conditions,
}: CollectionDropMintButtonProps) {
  const { address: walletAddress, hasWallet } = useWalletNativeSession();
  const { mintStatus, isLoading, mutate } = useDropMintStatus(
    collectionAddress,
    walletAddress ?? null
  );
  const action = useWalletWriteAction();
  const busy = action.status === "processing" || action.status === "confirming";

  const price = getPriceBigInt(conditions);
  const isPaid = price > 0n;

  const paymentToken = isPaid && conditions
    ? getListableTokens().find(
        (t) => normalizeAddress("STARKNET", t.address) === normalizeAddress("STARKNET", conditions.paymentToken)
      ) ?? null
    : null;

  const priceDisplay = isPaid && paymentToken
    ? `${Number(price * 10000n / BigInt(10 ** paymentToken.decimals)) / 10000} ${paymentToken.symbol}`
    : null;

  const handleMint = () => {
    if (!hasWallet) return;
    void action.run(handleUnlocked);
  };

  const handleUnlocked = async (signer: StarknetVenueSigner) => {
    const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];

    if (isPaid && conditions && conditions.paymentToken !== "0x0") {
      // Verify the payment token is a known listable token before approving
      const knownToken = getListableTokens().find(
        (t) => normalizeAddress("STARKNET", t.address) === normalizeAddress("STARKNET", conditions.paymentToken)
      );
      if (!knownToken) throw new Error("Unknown payment token — cannot proceed");
      // ERC-20 approve(collectionAddress, price as u256)
      const [priceLow, priceHigh] = u256CallData(price);
      calls.push({
        contractAddress: conditions.paymentToken,
        entrypoint: "approve",
        calldata: [collectionAddress, priceLow, priceHigh],
      });
    }

    // claim(quantity: u256(1))
    calls.push({
      contractAddress: collectionAddress,
      entrypoint: "claim",
      calldata: ["1", "0"],
    });

    // The platform fee is bundled into the SAME atomic multicall — no
    // separate fire-and-forget transaction needed. That pattern existed only
    // because ChipiPay's account was non-atomic; MediaWallet (like every
    // real wallet on medialane-starknet) executes one multicall as a single
    // all-or-nothing unit, so the fee can never be stranded on a reverted
    // claim. Drop claim quantity is fixed at 1, so grossAmount = price.
    if (isPaid && conditions && conditions.paymentToken !== "0x0") {
      const feeCall = buildFeeCall(
        { surface: "launchpad", token: conditions.paymentToken, grossAmount: price },
        ioFeeConfig,
      );
      if (feeCall) {
        calls.push({
          contractAddress: feeCall.contractAddress,
          entrypoint: feeCall.entrypoint,
          calldata: feeCall.calldata as string[],
        });
      }
    }

    const result = await signer.execute(calls);
    mutate();
    rewardToast("claim_drop");
    return result;
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
        Loading…
      </Button>
    );
  }

  // Per-wallet allowance: maxPerWallet "0" = unlimited.
  const maxPerWallet = conditions ? parseInt(conditions.maxPerWallet, 10) : 0;
  const mintedByWallet = mintStatus?.mintedByWallet ?? 0;
  const remaining = maxPerWallet > 0 ? Math.max(0, maxPerWallet - mintedByWallet) : Infinity;

  if (maxPerWallet > 0 && remaining <= 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-brand-orange font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Minted · {mintedByWallet} token{mintedByWallet !== 1 ? "s" : ""} (max reached)
      </div>
    );
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full gap-1.5 bg-brand-orange hover:brightness-110 text-white"
        onClick={handleMint}
        disabled={busy}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Minting…
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            {priceDisplay ? `Mint for ${priceDisplay}` : "Mint free"}
          </>
        )}
      </Button>
      {Number.isFinite(remaining) && (
        <p className="text-xs text-center text-muted-foreground">
          {mintedByWallet > 0 ? `You've minted ${mintedByWallet} · ` : ""}You can mint {remaining} more
        </p>
      )}

      <Dialog open={action.status === "success" || action.status === "error"} onOpenChange={(open) => { if (!open) action.reset(); }}>
        <DialogContent className="max-w-[calc(100%-6px)] sm:max-w-md p-0 overflow-hidden gap-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {action.status === "success" ? "Drop mint complete" : "Drop mint failed"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the result of your drop mint transaction.
          </DialogDescription>
          {action.status === "success" ? (
            <MarketplaceSuccessState
              name="Drop token"
              title="Mint complete!"
              description="Your drop token is now on-chain."
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : action.status === "error" ? (
            <MarketplaceErrorState
              name="Drop token"
              title="Mint failed"
              description="The drop mint could not be completed."
              error={action.error ?? undefined}
              txHash={action.txHash}
              explorerUrl={EXPLORER_URL}
              onDone={action.reset}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
