# Platform Hardening — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix address normalization end-to-end, replace all Clerk `publicMetadata` reads with ChipiPay wallet data, and add visible error states to all portfolio components.

**Architecture:** Three layers fixed in dependency order — backend first (standalone), SDK second (standalone), frontend last (consumes SDK v0.3.0). Each layer is independently deployable.

**Tech Stack:** Hono + Prisma + Bun (backend), TypeScript + tsup (SDK), Next.js 15 + SWR + shadcn/ui (frontend)

**Design doc:** `docs/plans/2026-03-09-portfolio-hardening-design.md`

---

## Pre-flight checks

Before starting, verify repo locations:
- Backend: `/Users/Shared/dev/medialane-backend`
- SDK: `/Users/Shared/dev/medialane-sdk`
- Frontend: `/Users/Shared/dev/medialane-io`

Bun binary: `/Users/kalamaha/.bun/bin/bun`

---

## LAYER 1 — Backend (`medialane-backend`)

### Task 1: Normalize address in `GET /v1/tokens/owned/:address`

**File:** `src/api/routes/tokens.ts`

The route currently uses `address.toLowerCase()` which does NOT pad to 64 chars. The DB stores `0x + 64 hex chars`. A ChipiPay address like `0x6abc...` (shorter than 64) would never match DB rows like `0x0000...6abc`.

**Step 1: Add import at top of file**

Open `src/api/routes/tokens.ts`. After the existing imports (line 6), add:
```typescript
import { normalizeAddress } from "../../utils/starknet.js";
```

**Step 2: Replace the two `.toLowerCase()` calls in the `/owned/:address` handler**

Find (lines 19 and 24):
```typescript
where: { chain: "STARKNET", owner: address.toLowerCase() },
```
and
```typescript
prisma.token.count({ where: { chain: "STARKNET", owner: address.toLowerCase() } }),
```

Replace both with:
```typescript
where: { chain: "STARKNET", owner: normalizeAddress(address) },
```
and
```typescript
prisma.token.count({ where: { chain: "STARKNET", owner: normalizeAddress(address) } }),
```

**Step 3: Verify build**
```bash
cd /Users/Shared/dev/medialane-backend
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -20
# If no build script, check tsc:
/Users/kalamaha/.bun/bin/bun tsc --noEmit 2>&1 | tail -20
```
Expected: No errors.

**Step 4: Commit**
```bash
cd /Users/Shared/dev/medialane-backend
git add src/api/routes/tokens.ts
git commit -m "fix: normalize address in GET /v1/tokens/owned/:address"
```

---

### Task 2: Normalize address in `GET /v1/orders/user/:address`

**File:** `src/api/routes/orders.ts`

**Step 1: Add import at top of file**

After the existing imports (line 6), add:
```typescript
import { normalizeAddress } from "../../utils/starknet.js";
```

**Step 2: Replace `.toLowerCase()` in the `/user/:address` handler**

Find the handler starting at line 145. Replace:
```typescript
where: { chain: "STARKNET", offerer: address.toLowerCase() },
orderBy: { createdAt: "desc" },
skip: (page - 1) * limit,
take: limit,
```
and the count:
```typescript
prisma.order.count({ where: { chain: "STARKNET", offerer: address.toLowerCase() } }),
```

With:
```typescript
where: { chain: "STARKNET", offerer: normalizeAddress(address) },
orderBy: { createdAt: "desc" },
skip: (page - 1) * limit,
take: limit,
```
and:
```typescript
prisma.order.count({ where: { chain: "STARKNET", offerer: normalizeAddress(address) } }),
```

**Step 3: Verify build**
```bash
/Users/kalamaha/.bun/bin/bun tsc --noEmit 2>&1 | tail -10
```

**Step 4: Commit**
```bash
git add src/api/routes/orders.ts
git commit -m "fix: normalize address in GET /v1/orders/user/:address"
```

---

### Task 3: Normalize address in `GET /v1/activities/:address`

**File:** `src/api/routes/activities.ts`

**Step 1: Add import**

After line 2 (`import prisma...`), add:
```typescript
import { normalizeAddress } from "../../utils/starknet.js";
```

**Step 2: Replace the toLowerCase in the `/:address` handler**

Find line 91:
```typescript
const addr = address.toLowerCase();
```

Replace with:
```typescript
const addr = normalizeAddress(address);
```

**Step 3: Verify + commit**
```bash
/Users/kalamaha/.bun/bin/bun tsc --noEmit 2>&1 | tail -10
git add src/api/routes/activities.ts
git commit -m "fix: normalize address in GET /v1/activities/:address"
```

---

### Task 4: Normalize owner in `GET /v1/collections?owner=`

**File:** `src/api/routes/collections.ts`

**Step 1: Add import**

After the existing imports (line 7), add:
```typescript
import { normalizeAddress } from "../../utils/starknet.js";
```

**Step 2: Replace toLowerCase on owner**

Find line 20:
```typescript
if (owner) where.owner = owner.toLowerCase();
```

Replace with:
```typescript
if (owner) where.owner = normalizeAddress(owner);
```

**Step 3: Verify + commit**
```bash
/Users/kalamaha/.bun/bin/bun tsc --noEmit 2>&1 | tail -10
git add src/api/routes/collections.ts
git commit -m "fix: normalize owner address in GET /v1/collections"
```

---

### Task 5: Deploy backend to Railway

```bash
cd /Users/Shared/dev/medialane-backend
git push origin main
```

Then in Railway dashboard: confirm deploy succeeded and `/health` returns `status: ok`.

---

## LAYER 2 — SDK (`medialane-sdk`)

### Task 6: Add address normalization inside SDK API methods

**File:** `src/api/client.ts`

The SDK exports `normalizeAddress` but never uses it internally. Every method that takes an address parameter should normalize before building the URL.

**Step 1: Add import at top of file**

After the existing type imports (after line 27), add:
```typescript
import { normalizeAddress } from "../utils/address.js";
```

**Step 2: Update `getOrdersByUser`**

Find (line 113-117):
```typescript
getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
  return this.get<ApiResponse<ApiOrder[]>>(
    `/v1/orders/user/${address}?page=${page}&limit=${limit}`
  );
}
```

Replace with:
```typescript
getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
  return this.get<ApiResponse<ApiOrder[]>>(
    `/v1/orders/user/${normalizeAddress(address)}?page=${page}&limit=${limit}`
  );
}
```

**Step 3: Update `getActiveOrdersForToken`**

Find (line 109-111):
```typescript
getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
  return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/token/${contract}/${tokenId}`);
}
```

Replace with:
```typescript
getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
  return this.get<ApiResponse<ApiOrder[]>>(
    `/v1/orders/token/${normalizeAddress(contract)}/${tokenId}`
  );
}
```

**Step 4: Update `getTokensByOwner`**

Find (line 127-131):
```typescript
getTokensByOwner(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiToken[]>> {
  return this.get<ApiResponse<ApiToken[]>>(
    `/v1/tokens/owned/${address}?page=${page}&limit=${limit}`
  );
}
```

Replace with:
```typescript
getTokensByOwner(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiToken[]>> {
  return this.get<ApiResponse<ApiToken[]>>(
    `/v1/tokens/owned/${normalizeAddress(address)}?page=${page}&limit=${limit}`
  );
}
```

**Step 5: Update `getToken`**

Find (line 121-124):
```typescript
getToken(contract: string, tokenId: string, wait = false): Promise<ApiResponse<ApiToken>> {
  return this.get<ApiResponse<ApiToken>>(
    `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
  );
}
```

Replace with:
```typescript
getToken(contract: string, tokenId: string, wait = false): Promise<ApiResponse<ApiToken>> {
  return this.get<ApiResponse<ApiToken>>(
    `/v1/tokens/${normalizeAddress(contract)}/${tokenId}${wait ? "?wait=true" : ""}`
  );
}
```

**Step 6: Update `getActivitiesByAddress`**

Find (line 182-190):
```typescript
getActivitiesByAddress(
  address: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<ApiActivity[]>> {
  return this.get<ApiResponse<ApiActivity[]>>(
    `/v1/activities/${address}?page=${page}&limit=${limit}`
  );
}
```

Replace with:
```typescript
getActivitiesByAddress(
  address: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<ApiActivity[]>> {
  return this.get<ApiResponse<ApiActivity[]>>(
    `/v1/activities/${normalizeAddress(address)}?page=${page}&limit=${limit}`
  );
}
```

**Step 7: Update `getCollectionsByOwner`**

Find (line 152-155):
```typescript
getCollectionsByOwner(owner: string, page = 1, limit = 50): Promise<ApiResponse<ApiCollection[]>> {
  const params = new URLSearchParams({ owner, page: String(page), limit: String(limit) });
  return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
}
```

Replace with:
```typescript
getCollectionsByOwner(owner: string, page = 1, limit = 50): Promise<ApiResponse<ApiCollection[]>> {
  const params = new URLSearchParams({ owner: normalizeAddress(owner), page: String(page), limit: String(limit) });
  return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
}
```

**Step 8: Update `getCollection` and `getCollectionTokens`**

Find:
```typescript
getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
  return this.get<ApiResponse<ApiCollection>>(`/v1/collections/${contract}`);
}
```
Replace with:
```typescript
getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
  return this.get<ApiResponse<ApiCollection>>(`/v1/collections/${normalizeAddress(contract)}`);
}
```

Find:
```typescript
getCollectionTokens(
  contract: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<ApiToken[]>> {
  return this.get<ApiResponse<ApiToken[]>>(
    `/v1/collections/${contract}/tokens?page=${page}&limit=${limit}`
  );
}
```
Replace with:
```typescript
getCollectionTokens(
  contract: string,
  page = 1,
  limit = 20
): Promise<ApiResponse<ApiToken[]>> {
  return this.get<ApiResponse<ApiToken[]>>(
    `/v1/collections/${normalizeAddress(contract)}/tokens?page=${page}&limit=${limit}`
  );
}
```

**Step 9: Verify TypeScript**
```bash
cd /Users/Shared/dev/medialane-sdk
/Users/kalamaha/.bun/bin/bun tsc --noEmit
```
Expected: No errors.

**Step 10: Commit**
```bash
git add src/api/client.ts
git commit -m "feat: normalize addresses internally in all SDK API methods"
```

---

### Task 7: Bump version and publish SDK v0.3.0

**File:** `package.json`

**Step 1: Bump version**

In `package.json`, change:
```json
"version": "0.2.8",
```
to:
```json
"version": "0.3.0",
```

**Step 2: Build**
```bash
cd /Users/Shared/dev/medialane-sdk
/Users/kalamaha/.bun/bin/bun run build
```
Expected: `dist/` updated with new files.

**Step 3: Commit**
```bash
git add package.json
git commit -m "chore: bump version to 0.3.0"
```

**Step 4: Publish**
```bash
npm publish --access public
```
Expected: `+ @medialane/sdk@0.3.0` in output.

---

## LAYER 3 — Frontend (`medialane-io`)

### Task 8: Update SDK dependency to v0.3.0

**Step 1: Update package**
```bash
cd /Users/Shared/dev/medialane-io
/Users/kalamaha/.bun/bin/bun add @medialane/sdk@0.3.0
```

**Step 2: Verify build**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -20
```
Expected: Clean build.

**Step 3: Commit**
```bash
git add package.json bun.lockb
git commit -m "chore: upgrade @medialane/sdk to v0.3.0"
```

---

### Task 9: Fix `use-chipi-transaction.ts` — replace Clerk metadata reads

**File:** `src/hooks/use-chipi-transaction.ts`

Currently reads wallet keys from `user.publicMetadata` (server-only) with a fallback to `user.unsafeMetadata`. Must use `useChipiWallet` from ChipiPay (the authoritative source) — same pattern as `use-session-key.ts`.

**Step 1: Update imports**

Replace:
```typescript
import { useState, useCallback, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallAnyContract } from "@chipi-stack/nextjs";
```

With:
```typescript
import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useCallAnyContract, useChipiWallet } from "@chipi-stack/nextjs";
```

**Step 2: Update the hook body**

Replace the hook signature and wallet setup:
```typescript
export function useChipiTransaction() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { callAnyContractAsync } = useCallAnyContract();
```

With:
```typescript
export function useChipiTransaction() {
  const { userId, getToken } = useAuth();

  const getBearerToken = useCallback(
    () => getToken({ template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay" }),
    [getToken]
  );

  const { wallet } = useChipiWallet({
    externalUserId: userId,
    getBearerToken,
    enabled: !!userId,
  });

  const { callAnyContractAsync } = useCallAnyContract();
```

**Step 3: Update `getWallet` callback**

Replace the entire `getWallet` callback:
```typescript
const getWallet = useCallback(
  (override?: ChipiTransactionParams["wallet"]) => {
    if (override) return override;
    // Check both publicMetadata (backend-set) and unsafeMetadata (frontend-set via WalletSetupDialog)
    const publicKey =
      (user?.publicMetadata?.publicKey ?? user?.unsafeMetadata?.publicKey) as
        | string
        | undefined;
    const encryptedPrivateKey =
      (user?.publicMetadata?.encryptedPrivateKey ??
        user?.unsafeMetadata?.encryptedPrivateKey) as string | undefined;
    if (!publicKey || !encryptedPrivateKey) {
      throw new Error("Wallet not set up. Please create your wallet first.");
    }
    return { publicKey, encryptedPrivateKey };
  },
  [user]
);
```

With:
```typescript
const getWallet = useCallback(
  (override?: ChipiTransactionParams["wallet"]) => {
    if (override) return override;
    if (!wallet?.encryptedPrivateKey) {
      throw new Error("Wallet not set up. Please create your wallet first.");
    }
    return {
      publicKey: wallet.normalizedPublicKey,
      encryptedPrivateKey: wallet.encryptedPrivateKey,
    };
  },
  [wallet]
);
```

**Step 4: Update the `executeTransaction` `getToken` call**

The `getToken` call inside `executeTransaction` currently re-specifies the template. Since we now have `getBearerToken`, replace:
```typescript
const token = await getToken({
  template: process.env.NEXT_PUBLIC_CLERK_TEMPLATE_NAME || "chipipay",
});
```
With:
```typescript
const token = await getBearerToken();
```

**Step 5: Update dependencies array of `executeTransaction`**

Change:
```typescript
[getToken, getWallet, callAnyContractAsync]
```
To:
```typescript
[getBearerToken, getWallet, callAnyContractAsync]
```

**Step 6: Verify build**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -20
```

**Step 7: Commit**
```bash
git add src/hooks/use-chipi-transaction.ts
git commit -m "fix: use ChipiWallet hook instead of Clerk metadata in useChipiTransaction"
```

---

### Task 10: Fix `app-sidebar.tsx` — replace `publicMetadata.publicKey`

**File:** `src/components/layout/app-sidebar.tsx`

**Step 1: Update imports**

Add `useSessionKey` import. After the existing imports, add:
```typescript
import { useSessionKey } from "@/hooks/use-session-key";
```

**Step 2: Replace the address read in `AppSidebar`**

Find (line 79-81):
```typescript
const { user, isLoaded, isSignedIn } = useUser();
const walletAddress = user?.publicMetadata?.publicKey as string | undefined;
const unreadOffers = useUnreadOffers(isSignedIn ? walletAddress : null);
```

Replace with:
```typescript
const { isLoaded, isSignedIn } = useUser();
const { walletAddress } = useSessionKey();
const unreadOffers = useUnreadOffers(isSignedIn ? walletAddress : null);
```

**Step 3: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/components/layout/app-sidebar.tsx
git commit -m "fix: use walletAddress from useSessionKey in AppSidebar"
```

---

### Task 11: Fix `launch-mint.tsx` and `launchpad-content.tsx`

**Files:**
- `src/components/launch-mint.tsx`
- `src/app/launchpad/launchpad-content.tsx`

**Step 1: Read both files to find the exact publicMetadata reads**
```bash
grep -n "publicMetadata\|unsafeMetadata" \
  /Users/Shared/dev/medialane-io/src/components/launch-mint.tsx \
  /Users/Shared/dev/medialane-io/src/app/launchpad/launchpad-content.tsx
```

**Step 2: In each file, add the `useSessionKey` import**
```typescript
import { useSessionKey } from "@/hooks/use-session-key";
```

**Step 3: Replace each occurrence**

The pattern to find: `user?.publicMetadata?.publicKey ?? user?.unsafeMetadata?.publicKey`

Replace logic: use `walletAddress` from `useSessionKey()`. For boolean checks like `hasWallet`:
```typescript
// Before
const hasWallet = !!(user?.publicMetadata?.publicKey || user?.unsafeMetadata?.publicKey);

// After
const { walletAddress } = useSessionKey();
const hasWallet = !!walletAddress;
```

For address value usage:
```typescript
// Before
const addr = user?.publicMetadata?.publicKey ?? user?.unsafeMetadata?.publicKey;

// After
const { walletAddress: addr } = useSessionKey();
```

**Step 4: Remove now-unused `useUser` import if it's no longer needed** (only if the file doesn't use `user` for anything else)

**Step 5: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/components/launch-mint.tsx src/app/launchpad/launchpad-content.tsx
git commit -m "fix: replace publicMetadata reads with useSessionKey in launch mint and launchpad"
```

---

### Task 12: Create shared `<EmptyOrError>` component

**File to create:** `src/components/ui/empty-or-error.tsx`

This replaces the scattered "isLoading → skeleton, else empty div" pattern in all portfolio components with one that also handles API errors visibly.

**Step 1: Create the file**

```typescript
"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyOrErrorProps {
  isLoading?: boolean;
  error?: unknown;
  isEmpty: boolean;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyCta?: { label: string; href?: string; onClick?: () => void };
  /** Skeleton to show while loading */
  skeleton: React.ReactNode;
}

export function EmptyOrError({
  isLoading,
  error,
  isEmpty,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyCta,
  skeleton,
}: EmptyOrErrorProps) {
  if (isLoading) return <>{skeleton}</>;

  if (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="h-10 w-10 mx-auto text-destructive/60" />
        <p className="font-semibold text-sm">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="font-semibold">{emptyTitle}</p>
        {emptyDescription && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyDescription}</p>
        )}
        {emptyCta && (
          emptyCta.href ? (
            <Button size="sm" asChild>
              <Link href={emptyCta.href}>{emptyCta.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={emptyCta.onClick}>{emptyCta.label}</Button>
          )
        )}
      </div>
    );
  }

  return null;
}
```

**Step 2: Verify build**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
```

**Step 3: Commit**
```bash
git add src/components/ui/empty-or-error.tsx
git commit -m "feat: add EmptyOrError component for consistent loading/error/empty states"
```

---

### Task 13: Apply `EmptyOrError` to all 5 portfolio components

**Files:**
- `src/components/portfolio/assets-grid.tsx`
- `src/components/portfolio/listings-table.tsx`
- `src/components/portfolio/offers-table.tsx`
- `src/components/portfolio/received-offers-table.tsx`
- `src/components/portfolio/portfolio-activity.tsx`

For each file, the pattern is the same:

**Step 1: Add import**
```typescript
import { EmptyOrError } from "@/components/ui/empty-or-error";
```

**Step 2: Replace the loading + empty pattern**

Before (example from `assets-grid.tsx`):
```typescript
if (isLoading) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
    </div>
  );
}

if (tokens.length === 0) {
  return (
    <div className="py-16 text-center space-y-4">
      ...
    </div>
  );
}
```

After:
```typescript
const empty = (
  <EmptyOrError
    isLoading={isLoading}
    error={error}
    isEmpty={tokens.length === 0}
    onRetry={handleRefresh}
    emptyTitle="No assets yet"
    emptyDescription="If you just minted something, it may take a few seconds to sync."
    emptyCta={{ label: "Mint asset", href: "/create/asset" }}
    skeleton={
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <TokenCardSkeleton key={i} />)}
      </div>
    }
  />
);
if (isLoading || error || tokens.length === 0) return empty;
```

Apply the same pattern to each component, adapting:
- `emptyTitle` / `emptyDescription` to the context
- `emptyCta` to the appropriate action
- `skeleton` to the existing skeleton JSX
- `error` from the hook's returned `error` value

For `listings-table.tsx`:
- emptyTitle: `"No active listings"`
- emptyDescription: `"List an asset from your portfolio to see it here."`
- no emptyCta needed (link to portfolio/assets instead)

For `offers-table.tsx`:
- emptyTitle: `"No active offers"`
- emptyDescription: `"Browse the marketplace to make offers on assets."`

For `received-offers-table.tsx`:
- emptyTitle: `"No incoming offers"`
- emptyDescription: `"Offers made on your assets will appear here."`

For `portfolio-activity.tsx`:
- emptyTitle: `"No activity yet"`
- no CTA

**Step 3: Verify build**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
```

**Step 4: Commit**
```bash
git add src/components/portfolio/
git commit -m "fix: show error state in portfolio components instead of silent empty"
```

---

### Task 14: Fix `portfolio-activity.tsx` — remove N+1 `useToken` calls

**File:** `src/components/portfolio/portfolio-activity.tsx`

Each `ActivityRow` currently calls `useToken(contract, tokenId)` — one API call per activity row. Since activities don't have enriched token metadata from the backend, and token names aren't critical for activity display, we remove this.

**Step 1: Remove the `useToken` import and call from `ActivityRow`**

Find in `ActivityRow`:
```typescript
import { useToken } from "@/hooks/use-tokens";
...
const { token } = useToken(contract, tokenId);
const tokenName = token?.metadata?.name ?? (tokenId ? `#${tokenId}` : null);
```

Replace with:
```typescript
const tokenName = tokenId ? `#${tokenId}` : null;
```

Remove the `useToken` import line if it's only used here.

**Step 2: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/components/portfolio/portfolio-activity.tsx
git commit -m "perf: remove N+1 useToken calls from activity feed rows"
```

---

### Task 15: Update `useCollectionsByOwner` to use SDK client

**File:** `src/hooks/use-collections.ts`

Currently makes a raw `fetch()` call. Should use the SDK client (which now normalizes internally).

**Step 1: Update `useCollectionsByOwner`**

Replace the entire function:
```typescript
export function useCollectionsByOwner(owner: string | null) {
  const { data, error, isLoading } = useSWR(
    owner ? `collections-owner-${owner}` : null,
    async () => {
      const params = new URLSearchParams({ owner: owner!, page: "1", limit: "50" });
      const res = await fetch(`${MEDIALANE_BACKEND_URL}/v1/collections?${params}`, {
        headers: { "x-api-key": MEDIALANE_API_KEY },
      });
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json() as Promise<ApiResponse<ApiCollection[]>>;
    },
    { revalidateOnFocus: false, refreshInterval: 12000 }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
}
```

With:
```typescript
export function useCollectionsByOwner(owner: string | null) {
  const client = useMedialaneClient();

  const { data, error, isLoading, mutate } = useSWR(
    owner ? `collections-owner-${owner}` : null,
    () => client.api.getCollectionsByOwner(owner!, 1, 50),
    { revalidateOnFocus: false, refreshInterval: 12000 }
  );

  return { collections: data?.data ?? [], isLoading, error, mutate };
}
```

**Step 2: Remove now-unused imports** (`MEDIALANE_BACKEND_URL`, `MEDIALANE_API_KEY` if not used elsewhere in the file). Add `useMedialaneClient` import if not already present.

**Step 3: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/hooks/use-collections.ts
git commit -m "refactor: useCollectionsByOwner now uses SDK client instead of raw fetch"
```

---

### Task 16: Fix `create/asset` page collection selector

**File:** `src/app/create/asset/page.tsx`

Currently uses `useUserCollections` (on-chain RPC). Replace with `useCollectionsByOwner` (API via SDK).

**Step 1: Read the file to find all uses of `useUserCollections`**
```bash
grep -n "useUserCollections\|UserCollection" /Users/Shared/dev/medialane-io/src/app/create/asset/page.tsx
```

**Step 2: Replace the import**

Remove:
```typescript
import { useUserCollections } from "@/hooks/use-user-collections";
```

Add:
```typescript
import { useCollectionsByOwner } from "@/hooks/use-collections";
```

**Step 3: Replace the hook call**

Find:
```typescript
const { collections, isLoading: collectionsLoading } = useUserCollections(walletAddress ?? null);
```

Replace with:
```typescript
const { collections, isLoading: collectionsLoading } = useCollectionsByOwner(walletAddress ?? null);
```

**Step 4: Update collection selector rendering**

`useUserCollections` returned `{ onChainId, contractAddress, name, symbol }`.
`useCollectionsByOwner` returns `ApiCollection[]` which has `contractAddress`, `name`, `symbol`, `id`.

Update any references to `col.onChainId` → use `col.contractAddress` or `col.id` as the key/value. The collection selector likely uses the collection ID to pass to `createMintIntent`. Check what field is passed to the mint intent and use the appropriate field from `ApiCollection`.

**Step 5: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/app/create/asset/page.tsx
git commit -m "fix: use API-based collection selector in create asset flow"
```

---

### Task 17: Add global SWR error handler

**File:** `src/app/providers.tsx`

**Step 1: Read the file to find the SWR configuration**
```bash
grep -n "SWRConfig\|swrConfig\|SWR" /Users/Shared/dev/medialane-io/src/app/providers.tsx | head -20
```

**Step 2: Wrap the app with `SWRConfig`**

If `SWRConfig` is not already present, add it around the app content:

```typescript
import { SWRConfig } from "swr";
import { toast } from "sonner";
```

Add `SWRConfig` wrapper with `onError`:
```typescript
<SWRConfig
  value={{
    onError: (error, key) => {
      // Only show toast for non-background keys (skip null keys = disabled hooks)
      if (key && error instanceof Error) {
        toast.error("Failed to load data", {
          description: error.message,
          duration: 4000,
        });
      }
    },
  }}
>
  {/* existing app content */}
</SWRConfig>
```

**Step 3: Verify build + commit**
```bash
/Users/kalamaha/.bun/bin/bun run build 2>&1 | tail -10
git add src/app/providers.tsx
git commit -m "feat: add global SWR error handler with toast notifications"
```

---

### Task 18: Final build verification and push

**Step 1: Full clean build**
```bash
cd /Users/Shared/dev/medialane-io
/Users/kalamaha/.bun/bin/bun run build 2>&1
```
Expected: All routes compile, no TypeScript errors, no warnings about missing modules.

**Step 2: Quick smoke-test checklist (browser)**
- [ ] Sign in → Portfolio → Assets loads (shows tokens or clean empty state, not blank)
- [ ] Portfolio → Listings shows orders or clean empty state
- [ ] Portfolio → Offers sent shows or clean empty state
- [ ] Portfolio → Activity shows or clean empty state
- [ ] Portfolio → Collections loads via API (no RPC calls in network tab)
- [ ] Disable network → all portfolio tabs show error state with Retry button, not blank
- [ ] Sidebar portfolio badge shows correct unread offer count

**Step 3: Push**
```bash
git push origin main
```

---

## Summary of all commits (in order)

| Repo | Commit message |
|---|---|
| backend | `fix: normalize address in GET /v1/tokens/owned/:address` |
| backend | `fix: normalize address in GET /v1/orders/user/:address` |
| backend | `fix: normalize address in GET /v1/activities/:address` |
| backend | `fix: normalize owner address in GET /v1/collections` |
| sdk | `feat: normalize addresses internally in all SDK API methods` |
| sdk | `chore: bump version to 0.3.0` |
| frontend | `chore: upgrade @medialane/sdk to v0.3.0` |
| frontend | `fix: use ChipiWallet hook instead of Clerk metadata in useChipiTransaction` |
| frontend | `fix: use walletAddress from useSessionKey in AppSidebar` |
| frontend | `fix: replace publicMetadata reads in launch mint and launchpad` |
| frontend | `feat: add EmptyOrError component` |
| frontend | `fix: show error state in portfolio components` |
| frontend | `perf: remove N+1 useToken calls from activity feed` |
| frontend | `refactor: useCollectionsByOwner uses SDK client` |
| frontend | `fix: use API-based collection selector in create asset flow` |
| frontend | `feat: add global SWR error handler with toast notifications` |
