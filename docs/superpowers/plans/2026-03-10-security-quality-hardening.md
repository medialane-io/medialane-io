# Security & Quality Hardening — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all valid issues from the pre-launch codebase audit — 2 critical security vulnerabilities, 7 important architectural/UX issues, and 9 minor bugs — before public launch.

**Architecture:** Issues are organised into 6 self-contained chunks ordered by priority: security first, then architecture, then transfer completeness, then portfolio UX, then validation, then minor polish. Each task commits independently.

> **I2 (SWR cache invalidation)**: Verified false positive. `use-marketplace.ts` already uses a filter-based `mutate((key) => ...)` that matches all pages of `tokens-owned-*`. No change needed.
> **m9 (unsafeMetadata memoization)**: `user` from Clerk is a stable reference; `user?.unsafeMetadata?.chipiSession` property access triggers no extra re-renders. Comment in `use-session-key.ts` already explains this. No change needed.
> **m3 (ipfsToHttp /placeholder.svg)**: `public/placeholder.svg` already exists; not broken. However, `ipfsToHttp` hardcodes the Pinata gateway URL instead of reading from `PINATA_GATEWAY` env var — this is the real issue and is fixed in Task 10.

**Tech Stack:** Next.js 15, TypeScript, Clerk, ChipiPay, Starknet.js, SWR, Zustand, shadcn/ui, Tailwind CSS, Bun

---

## Files changed

| File | Change |
|------|--------|
| `src/lib/constants.ts` | Remove hardcoded Alchemy RPC API key fallback |
| `src/app/onboarding/_actions.ts` | Stop writing `encryptedPrivateKey` to `publicMetadata` |
| `src/app/onboarding/page.tsx` | Remove `encryptedPrivateKey` from `completeOnboarding` call |
| `src/components/chipi/wallet-setup-dialog.tsx` | Remove `encryptedPrivateKey` from `completeOnboarding` call |
| `src/hooks/use-session-key.ts` | Remove dead fallback reads of `encryptedPrivateKey` from Clerk metadata |
| `src/hooks/use-chipi-transaction.ts` | Replace duplicate `RpcProvider` with singleton import |
| `src/components/shared/token-card.tsx` | Add `e.stopPropagation()` to all action button handlers |
| `src/components/layout/cart-drawer.tsx` | Document eslint-disable; fix `endTime: 0` stub |
| `src/app/search/page.tsx` | Document eslint-disable |
| `src/components/marketplace/transfer-dialog.tsx` | Add `hasActiveListing` warning + `isLoadingWallet` on submit button |
| `src/components/portfolio/assets-grid.tsx` | Pass `hasActiveListing` to TransferDialog |
| `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx` | Pass `hasActiveListing` + `onSuccess` to TransferDialog |
| `src/components/portfolio/assets-grid.tsx` | Add pagination (Load more) |
| `src/app/api/pinata/genesis/route.ts` | Add file type + size validation |
| `src/lib/utils.ts` | Use `PINATA_GATEWAY` env var in `ipfsToHttp` |
| `src/components/ui/pin-input.tsx` | Add max-length to `validatePin`; add hint on non-digit input |
| `src/hooks/use-transfer.ts` | Export `encodeTokenId` |
| `src/app/create/asset/page.tsx` | Revoke `URL.createObjectURL` on change and unmount |
| `src/app/create/collection/page.tsx` | Revoke `URL.createObjectURL` on change and unmount |
| `src/app/providers.tsx` | Remove fixed toast ID from SWR error handler |

---

## Chunk 1: Security (Critical + I5)

### Task 1: Remove hardcoded Alchemy RPC API key

**Files:**
- Modify: `src/lib/constants.ts:17-19`

The hardcoded Alchemy URL on line 19 includes a live API key. Because the constant uses `NEXT_PUBLIC_`, it is inlined into every browser bundle at build time. The key must be rotated and the hardcoded fallback removed.

- [ ] **Step 1: Edit `src/lib/constants.ts`**

Find:
```ts
export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL ||
  "https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/5Kaw8bJUF3QFKknr4N6Uo";
```

Replace with:
```ts
export const STARKNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "";
```

- [ ] **Step 2: Confirm `NEXT_PUBLIC_STARKNET_RPC_URL` is set in `.env.local`**

Open `.env.local`. If the variable is missing or still points to the compromised key, set it to a new Alchemy (or alternative) RPC endpoint. The app will not connect to Starknet without this value.

- [ ] **Step 3: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "security: remove hardcoded Alchemy RPC key from public bundle"
```

---

### Task 2: Stop writing `encryptedPrivateKey` to Clerk `publicMetadata`

**Files:**
- Modify: `src/app/onboarding/_actions.ts`
- Modify: `src/app/onboarding/page.tsx:54-57`
- Modify: `src/components/chipi/wallet-setup-dialog.tsx:68-74`

`publicMetadata` in Clerk appears in JWT tokens and is readable via the Clerk publishable key. An encrypted private key — even encrypted — must never appear there. The key is already available from the ChipiPay API (`wallet.encryptedPrivateKey`); storing it in Clerk metadata is redundant and insecure.

- [ ] **Step 1: Edit `src/app/onboarding/_actions.ts`**

Remove `encryptedPrivateKey` from the `WalletData` interface and from the `updateUser` call:

```ts
"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

interface WalletData {
  publicKey: string;
}

export async function completeOnboarding(walletData: WalletData) {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Not authenticated" };

    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        walletCreated: true,
        publicKey: walletData.publicKey,
      },
    });

    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete onboarding" };
  }
}
```

- [ ] **Step 2: Edit `src/app/onboarding/page.tsx`**

In `createWalletWithKey`, the `completeOnboarding` call currently passes `encryptedPrivateKey`. Remove it:

Find (around line 54):
```ts
    const result = await completeOnboarding({
      publicKey: wallet.publicKey,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
    });
```

Replace with:
```ts
    const result = await completeOnboarding({
      publicKey: wallet.publicKey,
    });
```

Also remove the `wallet.encryptedPrivateKey` check on line 50. The new check is just:
```ts
    if (!wallet?.publicKey) {
      throw new Error("Wallet creation returned invalid data");
    }
```

- [ ] **Step 3: Edit `src/components/chipi/wallet-setup-dialog.tsx`**

Find the `completeOnboarding` call (around line 74) which passes `encryptedPrivateKey`. Remove that field:

```ts
      const result = await completeOnboarding({
        publicKey: wallet.publicKey,
      });
```

Also update the guard before it — change `if (!wallet?.publicKey || !wallet?.encryptedPrivateKey)` to just `if (!wallet?.publicKey)`.

- [ ] **Step 4: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build.

- [ ] **Step 5: Commit**

```bash
git add src/app/onboarding/_actions.ts src/app/onboarding/page.tsx src/components/chipi/wallet-setup-dialog.tsx
git commit -m "security: stop writing encryptedPrivateKey to Clerk publicMetadata"
```

---

### Task 3: Remove dead `encryptedPrivateKey` fallback reads

**Files:**
- Modify: `src/hooks/use-session-key.ts:128-131`

After Task 2, no code writes `encryptedPrivateKey` to Clerk metadata. The fallback chain in `signTypedData` that reads from `unsafeMetadata` and `publicMetadata` is now both dead and insecure. Remove it — the ChipiPay API (`wallet?.encryptedPrivateKey`) is the only authoritative source.

- [ ] **Step 1: Edit `src/hooks/use-session-key.ts`**

In `signTypedData`, find the owner-key fallback chain (lines 127-131):

```ts
      // Owner key: from ChipiPay API (most reliable) or Clerk metadata fallback
      encryptedPk =
        wallet?.encryptedPrivateKey ??
        (user?.unsafeMetadata?.encryptedPrivateKey as string | undefined) ??
        (user?.publicMetadata?.encryptedPrivateKey as string | undefined);
```

Replace with:
```ts
      // Owner key: from ChipiPay API (authoritative source)
      encryptedPk = wallet?.encryptedPrivateKey;
```

Also remove `user` from the `signTypedData` dependency array (line 154), since it is no longer used inside the callback:

```ts
    [walletAddress, hasActiveSession, storedSession, wallet]
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build. TypeScript should not complain — `wallet?.encryptedPrivateKey` is already the first option in the chain.

- [ ] **Step 3: Verify signing in browser**

Sign in, create a session key (or let it expire so the owner-key fallback is used), and submit a marketplace listing or offer. Confirm the PIN flow completes without error.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/use-session-key.ts
git commit -m "security: remove dead Clerk metadata fallback from encryptedPrivateKey lookup"
```

---

## Chunk 2: Architecture

### Task 4: Replace duplicate `RpcProvider` with singleton

**Files:**
- Modify: `src/hooks/use-chipi-transaction.ts:6-7,40`

`src/lib/starknet.ts` exports a singleton `starknetProvider`. `use-chipi-transaction.ts` creates its own module-level `RpcProvider` instance, opening a second WebSocket connection to the Starknet RPC on every page. Replace it with the singleton.

- [ ] **Step 1: Edit `src/hooks/use-chipi-transaction.ts`**

Remove these two lines (top of file):
```ts
import { RpcProvider } from "starknet";
import { STARKNET_RPC_URL } from "@/lib/constants";
```

Add this import instead:
```ts
import { starknetProvider } from "@/lib/starknet";
```

Remove the module-level provider creation (around line 40):
```ts
const provider = new RpcProvider({ nodeUrl: STARKNET_RPC_URL });
```

Replace `provider.waitForTransaction` with `starknetProvider.waitForTransaction` inside `executeTransaction`:

```ts
          const receipt = await starknetProvider.waitForTransaction(result, { retryInterval: 3000 });
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-chipi-transaction.ts
git commit -m "perf: replace duplicate RpcProvider with shared singleton"
```

---

### Task 5: Fix click event propagation in TokenCard

**Files:**
- Modify: `src/components/shared/token-card.tsx`

All action buttons (Buy, Add to Cart, List, Transfer) sit inside a `<Link>` wrapper. Clicking a button calls `e.preventDefault()` but the click still bubbles to the `<Link>`'s anchor element, which fires `router.push()` and navigates away. Each handler needs `e.stopPropagation()` to prevent this.

- [ ] **Step 1: Edit `src/components/shared/token-card.tsx`**

Add `e.stopPropagation()` to `handleAddToCart`:

```ts
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeOrder || inCart) return;
    addItem({ ... });
  };
```

Add `e.stopPropagation()` to every inline button `onClick` that already has `e.preventDefault()`. There are five such handlers in the component:

1. The **Buy** button in the "has active order" section:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onBuy(token);
}}
```

2. The **Edit** (List) button in the "has active order" section:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onList(token);
}}
```

3. The **Transfer** button in the "has active order" section:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onTransfer(token);
}}
```

4. The **List for sale** button in the "no active order" section:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onList(token);
}}
```

5. The **Transfer** button in the "no active order" section:
```tsx
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  onTransfer(token);
}}
```

- [ ] **Step 2: Verify in browser**

Go to `/marketplace`. Click the "Buy" button on any listed token card. Verify the PurchaseDialog opens without navigating to the token detail page.

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/token-card.tsx
git commit -m "fix: add stopPropagation to TokenCard action buttons"
```

---

### Task 6: Document intentional eslint-disable suppressions

**Files:**
- Modify: `src/components/layout/cart-drawer.tsx:97`
- Modify: `src/app/search/page.tsx:108`

Both suppressions are for `react-hooks/exhaustive-deps`. In `cart-drawer.tsx`, the effect omits `items` and `client` intentionally — adding them would re-validate on every cart change instead of once on open. In `search/page.tsx`, the effect omits `client` because the SDK client is a stable singleton. Add comments so the intent is clear to future readers.

- [ ] **Step 1: Edit `src/components/layout/cart-drawer.tsx`**

Change line 97 from:
```ts
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps
```
To:
```ts
  // Intentionally depend only on `isOpen` — re-validating on `items` or `client`
  // change would re-check availability on every cart mutation rather than once on open.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
```

- [ ] **Step 2: Edit `src/app/search/page.tsx`**

Change line 108 from:
```ts
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
```
To:
```ts
  // Intentionally depend only on `q` — `client` is a stable singleton that
  // never changes, so omitting it from the dep array is safe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
```

- [ ] **Step 3: Lint**

```bash
~/.bun/bin/bun lint
```
Expected: No new lint errors (the comments now satisfy the inline suppression requirement).

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/cart-drawer.tsx src/app/search/page.tsx
git commit -m "chore: document intentional exhaustive-deps suppressions"
```

---

## Chunk 3: Transfer feature completeness

### Task 7: Warn about active listing before transfer + fix missing `onSuccess`

**Files:**
- Modify: `src/components/marketplace/transfer-dialog.tsx`
- Modify: `src/components/portfolio/assets-grid.tsx`
- Modify: `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`

Two issues combined here:

**I1** — When a token has an active listing and the owner transfers it, the listing becomes a dangling order pointing to a token they no longer own. The dialog must warn them.

**m8** — The `<TransferDialog>` in `asset-page-client.tsx` is missing the `onSuccess` prop. After a successful transfer from the asset detail page, the listings and token data are not explicitly refreshed (they are refreshed via SWR global invalidation in `useTransfer`, but `mutateListings` should also fire to update the listings tab instantly).

- [ ] **Step 1: Edit `src/components/marketplace/transfer-dialog.tsx`**

Add `hasActiveListing?: boolean` to `TransferDialogProps`:

```ts
interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  hasActiveListing?: boolean;
  onSuccess?: () => void;
}
```

Destructure it in the component function signature:
```ts
export function TransferDialog({
  open,
  onOpenChange,
  contractAddress,
  tokenId,
  tokenName,
  hasActiveListing = false,
  onSuccess,
}: TransferDialogProps) {
```

In the form state JSX (the third branch — not processing, not success), add a warning alert after the existing irreversibility `<Alert>`:

```tsx
              {/* Active listing warning */}
              {hasActiveListing && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This token has an active listing. A buyer could still complete
                    the purchase after you transfer it. Cancel the listing first,
                    or proceed with caution.
                  </AlertDescription>
                </Alert>
              )}
```

- [ ] **Step 2: Edit `src/components/portfolio/assets-grid.tsx`**

Pass `hasActiveListing` to `TransferDialog`:

```tsx
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
          hasActiveListing={!!transferToken.activeOrders?.[0]}
          onSuccess={mutate}
        />
      )}
```

- [ ] **Step 3: Edit `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`**

Find the `<TransferDialog>` at the bottom of the file (around line 716):

```tsx
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contractAddress={contract}
        tokenId={tokenId}
        tokenName={name}
      />
```

Replace with:

```tsx
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        contractAddress={contract}
        tokenId={tokenId}
        tokenName={name}
        hasActiveListing={activeListings.length > 0}
        onSuccess={mutateListings}
      />
```

- [ ] **Step 4: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build.

- [ ] **Step 5: Verify in browser**

On the asset detail page for a token that has an active listing, click Transfer. Verify the red warning banner appears above the address input.

- [ ] **Step 6: Commit**

```bash
git add src/components/marketplace/transfer-dialog.tsx src/components/portfolio/assets-grid.tsx src/app/asset/[contract]/[tokenId]/asset-page-client.tsx
git commit -m "feat: warn about active listing before transfer; fix missing onSuccess on asset page"
```

---

## Chunk 4: Portfolio UX & performance

### Task 8: Add pagination to the portfolio assets grid

**Files:**
- Modify: `src/components/portfolio/assets-grid.tsx`

`useTokensByOwner` already supports `page` and `limit` params but `AssetsGrid` always fetches page 1. Wallets with many tokens will never see assets beyond the first 20. Add a "Load more" button using the same accumulation pattern as the marketplace grid.

- [ ] **Step 1: Edit `src/components/portfolio/assets-grid.tsx`**

Full replacement of the component:

```tsx
"use client";

import { useState, useEffect } from "react";
import { useTokensByOwner } from "@/hooks/use-tokens";
import { TokenCard } from "@/components/shared/token-card";
import { ListingDialog } from "@/components/marketplace/listing-dialog";
import { TransferDialog } from "@/components/marketplace/transfer-dialog";
import { EmptyOrError } from "@/components/ui/empty-or-error";
import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import type { ApiToken } from "@medialane/sdk";

interface AssetsGridProps {
  address: string;
}

export function AssetsGrid({ address }: AssetsGridProps) {
  const [page, setPage] = useState(1);
  const [allTokens, setAllTokens] = useState<ApiToken[]>([]);

  const { tokens, meta, isLoading, error, mutate } = useTokensByOwner(address, page);

  // Accumulate pages
  useEffect(() => {
    setAllTokens((prev) => (page === 1 ? tokens : [...prev, ...tokens]));
  }, [tokens, page]);

  // Reset when address changes
  useEffect(() => {
    setPage(1);
    setAllTokens([]);
  }, [address]);

  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const handleList = (token: ApiToken) => {
    setSelectedToken(token);
    setListOpen(true);
  };

  const handleTransfer = (token: ApiToken) => {
    setTransferToken(token);
    setTransferOpen(true);
  };

  // After a write op, reset to page 1 and let SWR refetch
  const handleSuccess = () => {
    setPage(1);
    setAllTokens([]);
    mutate();
  };

  const hasMore = meta ? meta.total > allTokens.length : false;

  return (
    <>
      <EmptyOrError
        isLoading={isLoading && page === 1}
        error={error}
        isEmpty={allTokens.length === 0 && !isLoading}
        onRetry={mutate}
        emptyTitle="No assets yet"
        emptyDescription="Mint your first asset to get started."
        emptyCta={{ label: "Mint asset", href: "/create/asset" }}
        emptyIcon={<ImageIcon className="h-7 w-7 text-muted-foreground" />}
        skeletonCount={8}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {allTokens.map((token) => (
            <TokenCard
              key={`${token.contractAddress}-${token.tokenId}`}
              token={token}
              isOwner
              onList={handleList}
              onTransfer={handleTransfer}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Load more
            </Button>
          </div>
        )}
      </EmptyOrError>

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
          onSuccess={handleSuccess}
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
          hasActiveListing={!!transferToken.activeOrders?.[0]}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
```

Note: `EmptyOrError` receives `isLoading={isLoading && page === 1}` so it only shows the skeleton on the first page load, not on subsequent "Load more" loads. `meta.total` from the API tells us whether more pages exist.

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build.

- [ ] **Step 3: Verify in browser**

Open `/portfolio/assets`. With 20+ tokens in the wallet, verify the "Load more" button appears and clicking it appends the next page. With fewer than 20 tokens, verify no button appears.

- [ ] **Step 4: Commit**

```bash
git add src/components/portfolio/assets-grid.tsx
git commit -m "feat: add pagination to portfolio assets grid"
```

---

### Task 9: Show wallet loading state in TransferDialog

**Files:**
- Modify: `src/components/marketplace/transfer-dialog.tsx`

`isLoadingWallet` is returned from `useTransfer()` but never consumed. The submit button is active even before the wallet has loaded, which could cause a confusing "Wallet not ready" error if submitted immediately. Disable the button and show a loading label while the wallet loads.

- [ ] **Step 1: Edit `src/components/marketplace/transfer-dialog.tsx`**

Destructure `isLoadingWallet` from `useTransfer()`:

```ts
  const {
    transferToken,
    walletAddress,
    hasWallet,
    isProcessing,
    isLoadingWallet,
    txStatus,
    txHash,
    error,
    resetState,
  } = useTransfer();
```

Update the submit button:

```tsx
                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={isProcessing || isLoadingWallet}
                  >
                    {isLoadingWallet ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading wallet…
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        {hasWallet ? "Transfer" : "Set up wallet & transfer"}
                      </>
                    )}
                  </Button>
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/marketplace/transfer-dialog.tsx
git commit -m "ux: disable transfer button while wallet is loading"
```

---

## Chunk 5: Validation & API hardening

### Task 10: Add file validation to genesis upload route

**Files:**
- Modify: `src/app/api/pinata/genesis/route.ts`

The genesis route is admin-only (protected by `ADMIN_SECRET`) but accepts any file type and size for the `image` field. Add the same validation the regular upload routes use.

- [ ] **Step 1: Edit `src/app/api/pinata/genesis/route.ts`**

After the `if (!imageFile)` check, add:

```ts
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    if (!ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${imageFile.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (imageFile.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pinata/genesis/route.ts
git commit -m "fix: add file type and size validation to genesis upload route"
```

---

### Task 11: Use `PINATA_GATEWAY` env var in `ipfsToHttp`

**Files:**
- Modify: `src/lib/utils.ts:67-74`

`ipfsToHttp` hardcodes `https://gateway.pinata.cloud` instead of reading from the `PINATA_GATEWAY` constant (which reads from `NEXT_PUBLIC_PINATA_GATEWAY`). If the gateway is changed via env var, image URLs would still use the hardcoded domain.

- [ ] **Step 1: Edit `src/lib/utils.ts`**

Add import at the top of the file (after existing imports):

```ts
import { PINATA_GATEWAY } from "./constants";
```

Update `ipfsToHttp`:

```ts
export function ipfsToHttp(uri: string | null | undefined): string {
  if (!uri) return "/placeholder.svg";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice(7);
    return `${PINATA_GATEWAY}/ipfs/${cid}`;
  }
  return uri;
}
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```
Expected: Clean build.

- [ ] **Step 3: Verify in browser**

Open any token detail page that has an IPFS image. Confirm the image loads correctly (the URL in the browser should use your configured gateway, not a hardcoded one).

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts
git commit -m "fix: ipfsToHttp uses PINATA_GATEWAY env var instead of hardcoded URL"
```

---

### Task 12: Add max-length validation to `validatePin` + digit-only hint in `PinInput`

**Files:**
- Modify: `src/components/ui/pin-input.tsx`

Two sub-issues:

**m10** — `validatePin` enforces min 6 but not max 12. The `PinInput` UI limits to 12 via `.slice(0, 12)`, but a caller using a raw `<input>` bypasses this.

**m6** — Typing a letter in `PinInput` silently does nothing. Users expect visual feedback that non-digits are rejected.

- [ ] **Step 1: Edit `src/components/ui/pin-input.tsx`**

Full replacement:

```tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";

interface PinInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  autoFocus?: boolean;
}

export function PinInput({
  value,
  onChange,
  placeholder = "Enter 6–12 digit PIN",
  error,
  autoFocus = false,
}: PinInputProps) {
  const [visible, setVisible] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div className="space-y-1.5 w-full">
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const stripped = raw.replace(/\D/g, "").slice(0, 12);
            if (raw.length > stripped.length) {
              // Non-digit or over-length characters were stripped — show a brief hint
              if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
              setHint("Digits only (0–9)");
              hintTimerRef.current = setTimeout(() => setHint(null), 1500);
            }
            onChange(stripped);
          }}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border/60 bg-muted/30 px-4 py-3 pr-12 text-lg tracking-widest font-mono placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {(error || hint) && (
        <p
          className="text-xs font-medium"
          style={{ color: error ? "var(--color-destructive)" : "var(--color-muted-foreground)" }}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function validatePin(pin: string): string | null {
  if (!pin) return "PIN is required";
  if (!/^\d+$/.test(pin)) return "Digits only";
  if (pin.length < 6) return "Minimum 6 digits";
  if (pin.length > 12) return "Maximum 12 digits";
  return null;
}
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Verify in browser**

Open the wallet creation page (`/onboarding`). Type a letter into the PIN field. Verify the "Digits only (0–9)" hint appears briefly and disappears. Verify the letter does not appear in the field.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/pin-input.tsx
git commit -m "fix: validatePin max-length check; PinInput shows hint on non-digit input"
```

---

## Chunk 6: Minor fixes

### Task 13: Export `encodeTokenId` from `use-transfer.ts`

**Files:**
- Modify: `src/hooks/use-transfer.ts:21`

`encodeTokenId` is a pure utility function tested implicitly through transfer flows. Exporting it enables direct testing and reuse (e.g., in other entrypoints that accept `u256` token IDs).

- [ ] **Step 1: Edit `src/hooks/use-transfer.ts`**

Change:
```ts
function encodeTokenId(tokenId: string): [string, string] {
```
To:
```ts
export function encodeTokenId(tokenId: string): [string, string] {
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-transfer.ts
git commit -m "fix: export encodeTokenId for reuse and testability"
```

---

### Task 14: Revoke `URL.createObjectURL` blob URLs

**Files:**
- Modify: `src/app/create/asset/page.tsx`
- Modify: `src/app/create/collection/page.tsx`

Each time the user selects a file, a new blob URL is created but the old one is never revoked. Over repeated selections this accumulates in-memory blob objects until the tab is closed.

- [ ] **Step 1: Edit `src/app/create/asset/page.tsx`**

Add a `previewUrlRef` to track the current blob URL. Revoke it before creating a new one, and clean up on unmount.

Near the top of the component (with other `useState` declarations), add:

```ts
  const previewUrlRef = useRef<string | null>(null);
```

Add `useRef` to the React import if not already present.

Add a cleanup effect after the existing state declarations:

```ts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);
```

In the file `onChange` handler (around line 341), replace:
```ts
                    setImagePreview(URL.createObjectURL(file));
```
With:
```ts
                    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                    const objectUrl = URL.createObjectURL(file);
                    previewUrlRef.current = objectUrl;
                    setImagePreview(objectUrl);
```

- [ ] **Step 2: Edit `src/app/create/collection/page.tsx`**

Same pattern. Add `previewUrlRef` and unmount cleanup, then in `handleImageSelect` (around line 78):

Replace:
```ts
    setImagePreview(URL.createObjectURL(file));
```
With:
```ts
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setImagePreview(objectUrl);
```

And add the cleanup effect:
```ts
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);
```

- [ ] **Step 3: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/create/asset/page.tsx src/app/create/collection/page.tsx
git commit -m "fix: revoke blob URLs on file change and unmount to prevent memory leak"
```

---

### Task 15: Remove fixed toast ID from global SWR error handler

**Files:**
- Modify: `src/app/providers.tsx:48`

`toast.error(msg, { id: "swr-error" })` de-duplicates toasts by ID, which means only one error toast can show at a time. If multiple SWR fetches fail simultaneously (e.g., on network loss), only the first error is shown and subsequent ones are silently dropped.

- [ ] **Step 1: Edit `src/app/providers.tsx`**

Change:
```ts
            toast.error(msg, { id: "swr-error" });
```
To:
```ts
            toast.error(msg);
```

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/providers.tsx
git commit -m "fix: remove fixed toast ID so concurrent SWR errors all surface"
```

---

### Task 16: Fix cart `endTime: 0` stub

**Files:**
- Modify: `src/components/layout/cart-drawer.tsx:43-44`

`cartItemToOrder` builds a stub `ApiOrder` for use in `PurchaseDialog`. `endTime: 0` passes `new Date(0)` to `timeUntil()`, which returns `"Expired"`. The cart drawer already validates order freshness via `client.api.getOrder()` before showing items, so this stub is only displayed for valid orders. Use a reasonable future timestamp instead.

- [ ] **Step 1: Edit `src/components/layout/cart-drawer.tsx`**

Change:
```ts
    startTime: 0,
    endTime: 0,
```
To:
```ts
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
```

(30-day stub — cart items are revalidated on open anyway, so the actual expiry is checked separately.)

- [ ] **Step 2: Build**

```bash
~/.bun/bin/bun run build
```

- [ ] **Step 3: Verify in browser**

Add a token to the cart. Open the cart drawer. Click the individual "Buy" button. In the PurchaseDialog, verify the expiry does not show "Expired".

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/cart-drawer.tsx
git commit -m "fix: cart stub order uses future endTime instead of epoch 0"
```
