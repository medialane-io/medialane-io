# Asset Transfer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gasless, wallet-to-wallet ERC-721 transfer action to the asset detail page and portfolio assets grid.

**Architecture:** A new `useTransfer` hook wraps `useChipiTransaction` to execute a direct `transfer_from` call on the NFT contract via ChipiPay — no backend intent needed. A `TransferDialog` component (mirroring `ListingDialog`) handles address input + PIN flow. The dialog is wired into the asset detail page and portfolio grid as an additional owner action.

**Tech Stack:** Next.js 15 (App Router), TypeScript, shadcn/ui, react-hook-form + zod, ChipiPay (`@chipi-stack/nextjs`), Starknet.js, SWR, sonner (toasts), lucide-react icons, Bun (build/lint)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| **Create** | `src/hooks/use-transfer.ts` | Transfer business logic: calldata encoding, ChipiPay execution, SWR invalidation |
| **Create** | `src/components/marketplace/transfer-dialog.tsx` | Transfer UI: address input, PIN flow, processing/success states |
| **Modify** | `src/components/shared/token-card.tsx` | Add `onTransfer` prop + Transfer icon button for owners |
| **Modify** | `src/components/portfolio/assets-grid.tsx` | Wire `onTransfer` state + render `TransferDialog` |
| **Modify** | `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx` | Add Transfer button in owner action box + render `TransferDialog` |

---

## Chunk 1: New Files — Hook and Dialog

### Task 1: Create `useTransfer` hook

**Files:**
- Create: `src/hooks/use-transfer.ts`

**Key references:**
- `src/hooks/use-marketplace.ts` — pattern to follow (hook wraps `useChipiTransaction`, manages state, SWR invalidation)
- `src/hooks/use-chipi-transaction.ts` — `executeTransaction`, `ChipiCall` type, `status` values
- `src/hooks/use-session-key.ts` — `wallet`, `walletAddress`, `hasWallet`, `isLoadingWallet`

**Background:** Unlike marketplace ops (which use a backend intent → SNIP-12 sign → execute flow), a direct ERC-721 transfer calls `transfer_from` on the NFT contract with no backend involvement. The token ID is a Starknet `u256`, encoded as two felt252 values (low 128 bits, high 128 bits) in calldata.

- [ ] **Step 1: Create the hook file**

```typescript
// src/hooks/use-transfer.ts
"use client";

import { useState, useCallback } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { useChipiTransaction } from "./use-chipi-transaction";
import { useSessionKey } from "./use-session-key";
import type { ChipiCall } from "./use-chipi-transaction";

export interface TransferInput {
  contractAddress: string; // NFT contract address
  tokenId: string;         // Token ID — decimal ("42") or hex ("0x2a")
  toAddress: string;       // Recipient Starknet address
  pin: string;             // ChipiPay PIN to decrypt wallet key
}

/**
 * Encode a token ID (decimal or hex string) into two felt252 values
 * for Starknet u256 calldata: [low_128_bits, high_128_bits].
 */
function encodeTokenId(tokenId: string): [string, string] {
  const id = BigInt(tokenId);
  const low = (id & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString();
  const high = (id >> BigInt(128)).toString();
  return [low, high];
}

export function useTransfer() {
  const { executeTransaction, status, txHash, error: txError, reset } =
    useChipiTransaction();
  const { walletAddress, hasWallet, isLoadingWallet } = useSessionKey();
  const { mutate } = useSWRConfig();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  /** Invalidate owned-token and single-token SWR caches after a transfer. */
  const invalidate = useCallback(() => {
    mutate(
      (key) => {
        if (typeof key !== "string") return false;
        return key.startsWith("tokens-owned-") || key.startsWith("token-");
      },
      undefined,
      { revalidate: true }
    );
    // Re-invalidate after indexer processes the block (~10 s)
    setTimeout(() => {
      mutate(
        (key) => {
          if (typeof key !== "string") return false;
          return key.startsWith("tokens-owned-") || key.startsWith("token-");
        },
        undefined,
        { revalidate: true }
      );
    }, 10000);
  }, [mutate]);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setError(null);
    setHash(null);
    reset();
  }, [reset]);

  const transferToken = useCallback(
    async (input: TransferInput) => {
      if (!walletAddress) throw new Error("Wallet not ready. Please wait a moment.");

      setIsProcessing(true);
      setError(null);

      try {
        const [tokenIdLow, tokenIdHigh] = encodeTokenId(input.tokenId);

        // useChipiTransaction resolves its own wallet internally via useChipiWallet.
        // No walletOverride needed here — avoids coupling to ChipiPay's internal key shape.
        const call: ChipiCall = {
          contractAddress: input.contractAddress,
          entrypoint: "transfer_from",
          calldata: [walletAddress, input.toAddress, tokenIdLow, tokenIdHigh],
        };

        const result = await executeTransaction({
          pin: input.pin,
          contractAddress: input.contractAddress,
          calls: [call],
        });

        setHash(result.txHash);

        if (result.status === "reverted") {
          const msg = result.revertReason || "Transfer reverted on-chain";
          setError(msg);
          toast.error("Transfer failed", { description: msg });
          return undefined;
        }

        toast.success("Transfer complete!", {
          description: `Token #${input.tokenId} sent successfully.`,
        });
        invalidate();
        return result.txHash;
      } catch (err: any) {
        const msg = err?.message || "Transfer failed";
        setError(msg);
        toast.error("Transfer failed", { description: msg });
      } finally {
        setIsProcessing(false);
      }
    },
    [walletAddress, executeTransaction, invalidate]
  );

  return {
    transferToken,
    walletAddress,
    hasWallet,
    isLoadingWallet,
    isProcessing,
    txStatus: status,
    txHash: hash ?? txHash,
    error: error ?? txError,
    resetState,
  };
}
```

- [ ] **Step 2: Verify it builds cleanly**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors referencing `use-transfer.ts`. Build may show other pre-existing errors/warnings — ignore those, only care about errors in the new file.

- [ ] **Step 3: Commit**

```bash
cd /Users/Shared/dev/medialane-io
git add src/hooks/use-transfer.ts
git commit -m "feat: add useTransfer hook for direct ERC-721 wallet-to-wallet transfer"
```

---

### Task 2: Create `TransferDialog` component

**Files:**
- Create: `src/components/marketplace/transfer-dialog.tsx`

**Key references:**
- `src/components/marketplace/listing-dialog.tsx` — structure to mirror exactly (Dialog states, PinDialog flow, WalletSetupDialog guard)
- `src/components/chipi/pin-dialog.tsx` — PIN entry component API
- `src/components/chipi/wallet-setup-dialog.tsx` — wallet setup API
- `src/lib/constants.ts` — `EXPLORER_URL` for Voyager transaction link

**States:** form (address input + warning) → processing (spinner) → success (checkmark + tx link)

- [ ] **Step 1: Create the dialog file**

```typescript
// src/components/marketplace/transfer-dialog.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  ExternalLink,
  Loader2,
} from "lucide-react";
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
import { PinDialog } from "@/components/chipi/pin-dialog";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { useTransfer } from "@/hooks/use-transfer";
import { EXPLORER_URL } from "@/lib/constants";

// Schema defined outside component — no component-level variables needed.
// Self-transfer check is done in onSubmit with form.setError for better UX.
const schema = z.object({
  toAddress: z
    .string()
    .min(1, "Recipient address is required")
    .regex(
      /^0x[0-9a-fA-F]{1,64}$/,
      "Must be a valid Starknet address (starts with 0x, hex characters only)"
    ),
});

type FormValues = z.infer<typeof schema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  onSuccess?: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  contractAddress,
  tokenId,
  tokenName,
  onSuccess,
}: TransferDialogProps) {
  const {
    transferToken,
    walletAddress,
    hasWallet,
    isProcessing,
    txStatus,
    txHash,
    error,
    resetState,
  } = useTransfer();

  const [pinOpen, setPinOpen] = useState(false);
  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pendingAddress, setPendingAddress] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { toAddress: "" },
  });

  const onSubmit = (values: FormValues) => {
    // Self-transfer guard (done here since walletAddress is runtime state)
    if (
      walletAddress &&
      values.toAddress.toLowerCase() === walletAddress.toLowerCase()
    ) {
      form.setError("toAddress", { message: "Cannot transfer to yourself" });
      return;
    }
    setPendingAddress(values.toAddress);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingAddress) return;
    await transferToken({ contractAddress, tokenId, toAddress: pendingAddress, pin });
  };

  const handleClose = (v: boolean) => {
    if (!isProcessing) {
      resetState();
      form.reset();
      setPendingAddress(null);
      onOpenChange(v);
    }
  };

  const isSuccess = txStatus === "confirmed";
  const displayName = tokenName || `Token #${tokenId}`;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transfer asset</DialogTitle>
          </DialogHeader>

          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="font-semibold text-lg">Transfer complete!</p>
              <p className="text-sm text-muted-foreground text-center">
                {displayName} has been sent successfully.
              </p>
              {txHash && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`${EXPLORER_URL}/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    View on Voyager <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button
                className="w-full"
                onClick={() => {
                  resetState();
                  form.reset();
                  setPendingAddress(null);
                  onOpenChange(false);
                  onSuccess?.();
                }}
              >
                Done
              </Button>
            </div>
          ) : isProcessing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {txStatus === "submitting"
                  ? "Submitting transfer…"
                  : "Confirming on Starknet…"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Asset info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Badge variant="outline" className="font-mono">
                  #{tokenId}
                </Badge>
                <span className="text-sm font-medium truncate">{displayName}</span>
              </div>

              {/* Irreversibility warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This action is irreversible. Double-check the recipient address
                  before confirming.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="toAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0x..."
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

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isProcessing}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    {hasWallet ? "Transfer" : "Set up wallet & transfer"}
                  </Button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Gas is free. Your PIN authorises the transfer.
                  </p>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm transfer"
        description={`Enter your PIN to transfer ${displayName} to ${pendingAddress?.slice(0, 10)}…`}
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setPinOpen(true);
        }}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify it builds cleanly**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun run build 2>&1 | tail -30
```

Expected: no TypeScript errors in `use-transfer.ts` or `transfer-dialog.tsx`. Ignore pre-existing warnings.

- [ ] **Step 3: Run lint**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun lint 2>&1 | grep -E "transfer"
```

Expected: no lint errors in the new files (output may be empty, which is fine).

- [ ] **Step 4: Commit**

```bash
cd /Users/Shared/dev/medialane-io
git add src/components/marketplace/transfer-dialog.tsx
git commit -m "feat: add TransferDialog component for ERC-721 asset transfers"
```

---

## Chunk 2: Integration — Wire Transfer into Existing Pages

### Task 3: Add Transfer action to `TokenCard`

**Files:**
- Modify: `src/components/shared/token-card.tsx`

**Background:** `TokenCard` already has `onList?: (token: ApiToken) => void` for owner listing. We add `onTransfer` in the same pattern. The Transfer button renders as a small icon button alongside the List button in the owner actions area.

- [ ] **Step 1: Add `onTransfer` prop to `TokenCardProps` and render Transfer button**

Open `src/components/shared/token-card.tsx`.

Change the `TokenCardProps` interface (currently ends at `isOwner?`):

```typescript
// BEFORE:
interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  isOwner?: boolean;
}

// AFTER:
interface TokenCardProps {
  token: ApiToken;
  showBuyButton?: boolean;
  onBuy?: (token: ApiToken) => void;
  onList?: (token: ApiToken) => void;
  onTransfer?: (token: ApiToken) => void;
  isOwner?: boolean;
}
```

Update the destructured props in the function signature:

```typescript
// BEFORE:
export function TokenCard({
  token,
  showBuyButton = true,
  onBuy,
  onList,
  isOwner = false,
}: TokenCardProps) {

// AFTER:
export function TokenCard({
  token,
  showBuyButton = true,
  onBuy,
  onList,
  onTransfer,
  isOwner = false,
}: TokenCardProps) {
```

Add `ArrowRightLeft` to the lucide-react import (currently only `ShoppingCart, Tag`):

```typescript
// BEFORE:
import { ShoppingCart, Tag } from "lucide-react";

// AFTER:
import { ShoppingCart, Tag, ArrowRightLeft } from "lucide-react";
```

In the owner "has active order" section, add the Transfer button after the existing Edit button. The current block (lines ~123–136) reads:

```typescript
{isOwner && onList && activeOrder && (
  <Button
    size="sm"
    variant="outline"
    className="h-8 text-xs"
    onClick={(e) => {
      e.preventDefault();
      onList(token);
    }}
  >
    <Tag className="h-3 w-3 mr-1" />
    Edit
  </Button>
)}
```

Replace with:

```typescript
{isOwner && onList && activeOrder && (
  <Button
    size="sm"
    variant="outline"
    className="h-8 text-xs"
    onClick={(e) => {
      e.preventDefault();
      onList(token);
    }}
  >
    <Tag className="h-3 w-3 mr-1" />
    Edit
  </Button>
)}
{isOwner && onTransfer && (
  <Button
    size="sm"
    variant="outline"
    className="h-8 w-8 p-0"
    onClick={(e) => {
      e.preventDefault();
      onTransfer(token);
    }}
    aria-label="Transfer asset"
    title="Transfer to another wallet"
  >
    <ArrowRightLeft className="h-3.5 w-3.5" />
  </Button>
)}
```

In the owner "no active order" section (currently lines ~141–153):

```typescript
{!activeOrder && isOwner && onList && (
  <Button
    size="sm"
    variant="outline"
    className="w-full h-9 text-xs"
    onClick={(e) => {
      e.preventDefault();
      onList(token);
    }}
  >
    <Tag className="h-3 w-3 mr-1.5" />
    List for sale
  </Button>
)}
```

Replace with:

```typescript
{!activeOrder && isOwner && (
  <div className="flex gap-1.5">
    {onList && (
      <Button
        size="sm"
        variant="outline"
        className="flex-1 h-9 text-xs"
        onClick={(e) => {
          e.preventDefault();
          onList(token);
        }}
      >
        <Tag className="h-3 w-3 mr-1.5" />
        List for sale
      </Button>
    )}
    {onTransfer && (
      <Button
        size="sm"
        variant="outline"
        className="h-9 w-9 p-0 shrink-0"
        onClick={(e) => {
          e.preventDefault();
          onTransfer(token);
        }}
        aria-label="Transfer asset"
        title="Transfer to another wallet"
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
      </Button>
    )}
  </div>
)}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors in `token-card.tsx`. The `onTransfer` prop is optional so all existing call sites without it still compile.

- [ ] **Step 3: Commit**

```bash
cd /Users/Shared/dev/medialane-io
git add src/components/shared/token-card.tsx
git commit -m "feat: add onTransfer prop and Transfer icon button to TokenCard"
```

---

### Task 4: Wire Transfer into `AssetsGrid`

**Files:**
- Modify: `src/components/portfolio/assets-grid.tsx`

**Background:** `AssetsGrid` already manages `ListingDialog` state with a selected token. We add the same pattern for `TransferDialog`. On transfer success, call `mutate()` to refresh the owned tokens list (the asset will disappear from the portfolio since it's no longer owned).

- [ ] **Step 1: Update `AssetsGrid`**

Open `src/components/portfolio/assets-grid.tsx`. Apply these changes:

Add `TransferDialog` to the imports (alongside `ListingDialog`):

```typescript
// BEFORE:
import { ListingDialog } from "@/components/marketplace/listing-dialog";

// AFTER:
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
```

In the component body, add transfer state alongside the existing listing state:

```typescript
// BEFORE:
const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
const [listOpen, setListOpen] = useState(false);

// AFTER:
const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
const [listOpen, setListOpen] = useState(false);
const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
const [transferOpen, setTransferOpen] = useState(false);
```

Add the transfer handler alongside `handleList`:

```typescript
// BEFORE:
const handleList = (token: ApiToken) => {
  setSelectedToken(token);
  setListOpen(true);
};

// AFTER:
const handleList = (token: ApiToken) => {
  setSelectedToken(token);
  setListOpen(true);
};

const handleTransfer = (token: ApiToken) => {
  setTransferToken(token);
  setTransferOpen(true);
};
```

Pass `onTransfer` to each `TokenCard`:

```typescript
// BEFORE:
<TokenCard
  key={`${token.contractAddress}-${token.tokenId}`}
  token={token}
  isOwner
  onList={handleList}
/>

// AFTER:
<TokenCard
  key={`${token.contractAddress}-${token.tokenId}`}
  token={token}
  isOwner
  onList={handleList}
  onTransfer={handleTransfer}
/>
```

Add `TransferDialog` to the returned JSX, after the existing `ListingDialog`:

```typescript
// BEFORE:
{selectedToken && (
  <ListingDialog
    open={listOpen}
    onOpenChange={(v) => {
      setListOpen(v);
      if (!v) setSelectedToken(null);
    }}
    assetContract={selectedToken.contractAddress}
    tokenId={selectedToken.tokenId}
    tokenName={selectedToken.metadata?.name ?? undefined}
  />
)}

// AFTER:
{selectedToken && (
  <ListingDialog
    open={listOpen}
    onOpenChange={(v) => {
      setListOpen(v);
      if (!v) setSelectedToken(null);
    }}
    assetContract={selectedToken.contractAddress}
    tokenId={selectedToken.tokenId}
    tokenName={selectedToken.metadata?.name ?? undefined}
  />
)}

{transferToken && (
  <TransferDialog
    open={transferOpen}
    onOpenChange={(v) => {
      setTransferOpen(v);
      if (!v) setTransferToken(null);
    }}
    contractAddress={transferToken.contractAddress}
    tokenId={transferToken.tokenId}
    tokenName={transferToken.metadata?.name ?? undefined}
    onSuccess={mutate}
  />
)}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun run build 2>&1 | tail -20
```

Expected: no TypeScript errors in `assets-grid.tsx`.

- [ ] **Step 3: Commit**

```bash
cd /Users/Shared/dev/medialane-io
git add src/components/portfolio/assets-grid.tsx
git commit -m "feat: wire TransferDialog into portfolio AssetsGrid"
```

---

### Task 5: Add Transfer to the Asset Detail Page

**Files:**
- Modify: `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`

**Background:** The asset detail page already imports `ArrowRightLeft` from lucide-react and has a structured owner action box with two branches: one when the token is listed (`cheapest` exists) and one when it is not. We add a Transfer button in both branches, always as the last owner action. The dialog goes in the "Dialogs" section at the bottom of the return statement.

- [ ] **Step 1: Add `TransferDialog` import**

Near the top of the file where other dialogs are imported (around line 13-16):

```typescript
// BEFORE:
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";

// AFTER:
import { PurchaseDialog } from "@/components/marketplace/purchase-dialog";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { OfferDialog } from "@/components/marketplace/offer-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
```

- [ ] **Step 2: Add `transferOpen` state**

In the component body, alongside existing dialog state variables (around line 48-55):

```typescript
// BEFORE:
const [orderToAccept, setOrderToAccept] = useState<ApiOrder | null>(null);
const [acceptPinOpen, setAcceptPinOpen] = useState(false);

// AFTER:
const [orderToAccept, setOrderToAccept] = useState<ApiOrder | null>(null);
const [acceptPinOpen, setAcceptPinOpen] = useState(false);
const [transferOpen, setTransferOpen] = useState(false);
```

- [ ] **Step 3: Add Transfer button in the "listed" owner branch**

Find the `isOwner` branch inside the price/action box (the block starting with `isOwner ? (`). Currently it has two buttons: "Cancel listing" and "Create new listing". Add the Transfer button after them:

```typescript
// BEFORE (the isOwner block inside the price box):
{isOwner ? (
  <div className="space-y-2">
    <Button
      variant="destructive"
      className="w-full"
      disabled={isProcessing}
      onClick={() => handleCancelClick(myListing ?? cheapest)}
    >
      <X className="h-4 w-4 mr-2" />
      Cancel listing
    </Button>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setListOpen(true)}
    >
      <Tag className="h-4 w-4 mr-2" />
      Create new listing
    </Button>
  </div>
) : (

// AFTER:
{isOwner ? (
  <div className="space-y-2">
    <Button
      variant="destructive"
      className="w-full"
      disabled={isProcessing}
      onClick={() => handleCancelClick(myListing ?? cheapest)}
    >
      <X className="h-4 w-4 mr-2" />
      Cancel listing
    </Button>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setListOpen(true)}
    >
      <Tag className="h-4 w-4 mr-2" />
      Create new listing
    </Button>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setTransferOpen(true)}
    >
      <ArrowRightLeft className="h-4 w-4 mr-2" />
      Transfer
    </Button>
  </div>
) : (
```

- [ ] **Step 4: Add Transfer button in the "not listed" owner branch**

Find the "not listed" action box (the else branch of `cheapest ?`). The owner block currently has only a "List for sale" button:

```typescript
// BEFORE:
{isOwner ? (
  <Button className="w-full" onClick={() => setListOpen(true)}>
    <Tag className="h-4 w-4 mr-2" />
    List for sale
  </Button>
) : (

// AFTER:
{isOwner ? (
  <div className="space-y-2">
    <Button className="w-full" onClick={() => setListOpen(true)}>
      <Tag className="h-4 w-4 mr-2" />
      List for sale
    </Button>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setTransferOpen(true)}
    >
      <ArrowRightLeft className="h-4 w-4 mr-2" />
      Transfer
    </Button>
  </div>
) : (
```

- [ ] **Step 5: Add `TransferDialog` to the dialogs section**

At the bottom of the return statement, after the last `PinDialog` (around line 680-695), add:

```typescript
<TransferDialog
  open={transferOpen}
  onOpenChange={setTransferOpen}
  contractAddress={contract}
  tokenId={tokenId}
  tokenName={name}
/>
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun run build 2>&1 | tail -30
```

Expected: clean build with no TypeScript errors in `asset-page-client.tsx`.

- [ ] **Step 7: Run full lint**

```bash
cd /Users/Shared/dev/medialane-io && ~/.bun/bin/bun lint 2>&1
```

Expected: no new lint errors introduced by the feature.

- [ ] **Step 8: Commit**

```bash
cd /Users/Shared/dev/medialane-io
git add src/app/asset/[contract]/[tokenId]/asset-page-client.tsx
git commit -m "feat: add Transfer button and TransferDialog to asset detail page"
```

---

### Task 6: Browser Verification

**Goal:** Confirm the transfer flow works end-to-end in the browser before shipping.

**Pre-requisite:** Dev server running (`~/.bun/bin/bun dev`) and backend running on port 3001.

- [ ] **Step 1: Verify Transfer button appears on asset detail page (owner view)**

  1. Sign in and navigate to an asset you own: `/asset/<contract>/<tokenId>`
  2. In the right column, confirm you see:
     - "Cancel listing" + "Create new listing" + **"Transfer"** buttons (if listed), OR
     - "List for sale" + **"Transfer"** buttons (if not listed)
  3. Click "Transfer" — `TransferDialog` should open with asset badge, warning banner, and address input.

- [ ] **Step 2: Verify validation in `TransferDialog`**

  1. Submit empty form → expect "Recipient address is required"
  2. Submit `notanaddress` → expect "Must be a valid Starknet address (starts with 0x, hex characters only)"
  3. Submit your own wallet address → expect "Cannot transfer to yourself"
  4. Submit a valid address (`0x` + up to 64 hex chars) → expect PIN dialog to open

- [ ] **Step 3: Verify Transfer button appears in portfolio assets grid**

  1. Navigate to `/portfolio/assets`
  2. Each asset card should show a small `ArrowRightLeft` icon button
  3. Click it — `TransferDialog` should open for that asset

- [ ] **Step 4: (Optional live test) Execute a real transfer**

  If you have two test wallets and a test asset:
  1. Open the transfer dialog on an asset you own
  2. Paste the recipient address, click Transfer
  3. Enter PIN
  4. Confirm tx submits and enters "Confirming on Starknet…" state
  5. On confirmation: success screen appears with Voyager link
  6. Navigate to `/portfolio/assets` — transferred asset no longer appears
  7. Check the activity feed (`/activities`) — a "Transfer" event should appear

  **Note:** If the transaction reverts with a calldata error, the likely cause is the `transfer_from` entrypoint name — some collection contracts use `transferFrom` (camelCase). In that case, update `entrypoint: "transfer_from"` to `entrypoint: "transferFrom"` in `src/hooks/use-transfer.ts` and test again.
