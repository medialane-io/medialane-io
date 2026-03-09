# Medialane Platform Hardening — Design Document
**Date:** 2026-03-09
**Approach:** B — Systematic hardening across all layers
**Scope:** medialane-backend, medialane-sdk, medialane-io

---

## Problem Statement

The portfolio section was showing empty state for all users (assets, offers, listings, activity) because:

1. Every portfolio page read wallet address from `user.publicMetadata.publicKey` — a Clerk server-only field that was inconsistently set and in an un-normalized format
2. `useUserOrders` was the only SWR hook not normalizing addresses before API calls
3. API route handlers on the backend only applied `.toLowerCase()` (not full 64-char padding) to query params — address format mismatch caused silent DB query failures
4. The SDK exports `normalizeAddress()` but never uses it internally, placing the normalization burden on every consumer
5. All 5 portfolio components show identical "No items" empty state whether the API returned 0 results or a 500 error — failures are invisible to users

---

## Layer Contract

Each layer owns its own normalization. No layer assumes the layer above it normalized correctly.

```
ChipiPay wallet
      │ normalizedPublicKey (0x + 64 hex chars)
      ▼
 useSessionKey()        ← single source of truth for walletAddress in frontend
      │
      ▼
  SDK API methods       ← normalizeAddress() applied before URL construction
      │
      ▼
 Backend API routes     ← normalizeAddress() applied to every address param
      │
      ▼
  PostgreSQL            ← stores 0x + 64 hex chars (unchanged, correct)
```

**Frontend:** always reads `walletAddress` from `useSessionKey()`, never from Clerk metadata
**SDK:** callers pass any valid address format; SDK normalizes before sending
**Backend:** API routes normalize before DB queries; DB format never changes

---

## SDK v0.3.0 Changes

### Address normalization in every API method
`normalizeAddress()` already exists in SDK utils but is never called internally. Apply it to every address parameter before URL construction.

Affected methods: `getTokensByOwner`, `getOrdersByUser`, `getActivitiesByAddress`, `getActiveOrdersForToken`, `getCollection`, `getCollectionTokens`, `offerer` filter in `getOrders`.

### Add `getCollectionsByOwner()` to ApiClient
Currently only exists as a raw `fetch()` in the frontend. Belongs in the SDK:
```typescript
getCollectionsByOwner(owner: string, page = 1, limit = 50): Promise<ApiResponse<ApiCollection[]>>
```

### Typed `MedialaneApiError`
Replace generic `Error` throws with a typed error class carrying `status` (HTTP code) and `code` (string) so consumers can distinguish 404 from 500.

**Version:** `0.2.8` → `0.3.0`

---

## Backend Changes

### Full address normalization in API routes
Replace `.toLowerCase()` with `normalizeAddress()` (pad to 64 chars + lowercase) on every address path param and query param:
- `GET /v1/tokens/owned/:address`
- `GET /v1/orders/user/:address`
- `GET /v1/activities/:address`
- `GET /v1/collections?owner=`
- `GET /v1/orders?offerer=`

### Indexer health endpoint
Add `GET /v1/health/indexer` returning:
```json
{
  "cursorBlock": 6210000,
  "latestBlock": 6210050,
  "lagBlocks": 50,
  "lagSeconds": 300,
  "status": "healthy" | "behind" | "stalled"
}
```

### Collection metadata lookup hardening
Replace name-based intent matching in `findIntentMetadata()` with contractAddress-based matching. The CollectionCreated event provides the deployed contract address deterministically.

---

## Frontend Changes

### Replace all remaining `publicMetadata.publicKey` reads
- `use-chipi-transaction.ts` → read wallet keys from ChipiPay's `useChipiWallet` hook directly
- `app-sidebar.tsx` → use `walletAddress` from `useSessionKey()`
- `launch-mint.tsx` → use `walletAddress` from `useSessionKey()`
- `launchpad-content.tsx` → use `walletAddress` from `useSessionKey()`

### Shared `<EmptyOrError>` component
Single component covering all three states: loading skeleton, error with retry button, empty state with CTA. Eliminates the pattern where 500 errors look like empty data.

```tsx
<EmptyOrError
  isLoading={isLoading}
  error={error}
  isEmpty={items.length === 0}
  onRetry={mutate}
  emptyTitle="No assets yet"
  emptyDescription="Mint your first asset to get started."
  emptyCta={{ label: "Mint asset", href: "/create/asset" }}
/>
```

### Global SWR error handler
Configure `SWRConfig` provider with `onError` to show a sonner toast on API failures — users always know when something went wrong.

### `create/asset` collection selector → API
Replace `useUserCollections` (on-chain RPC) with `useCollectionsByOwner` (SDK API) for consistency with the rest of the app.

### `portfolio-activity.tsx` N+1 fix
Remove per-row `useToken()` calls. Show token links as `Contract #tokenId` — no extra API calls, correct behavior, faster render.

---

## Error Handling Matrix

| Scenario | Before | After |
|---|---|---|
| API returns 500 | Shows "No items" | Error state + retry button |
| API returns 404 | Shows "No items" | Empty state (correct) |
| Network offline | Shows "No items" | "Connection error" + retry |
| Wallet loading | Empty flash + redirect | Skeleton until loaded |
| Indexer lagging | No indication | Health endpoint shows lag |
| Wrong address format | Silent DB miss → empty | Normalized at every layer |

---

## Delivery Order

1. **Backend** — normalize API routes + health endpoint + collection metadata fix
2. **SDK** — normalize internally + add `getCollectionsByOwner` + `MedialaneApiError` → publish v0.3.0
3. **Frontend** — update SDK dep, replace publicMetadata reads, add `<EmptyOrError>`, fix N+1, global SWR error handler

Each layer is independently deployable and testable. Frontend changes are last because they depend on SDK v0.3.0.

---

## Success Criteria

- Portfolio assets, listings, offers, received offers, and activity all load correctly for users with wallets
- API errors show a visible error state — never silently look like empty data
- Any valid Starknet address format (padded, unpadded, uppercase, lowercase) works correctly end-to-end
- New minted assets appear in portfolio within one indexer cycle (~6s)
- Indexer health is observable without digging through Railway logs
