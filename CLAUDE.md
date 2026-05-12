# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Always use the full bun path — bun is not in PATH by default on this machine
~/.bun/bin/bun dev          # Start dev server (Next.js 15, port 3000)
~/.bun/bin/bun run build    # Production build (must pass clean before deploy)
~/.bun/bin/bun start        # Start production server
~/.bun/bin/bun lint         # Run ESLint

# No test runner is configured. Verify with the browser after changes.
```

All package management uses **Bun** (not npm/yarn). Use `bun add`, `bun remove`, etc.

**Important:** Backend runs on port 3000 by default. When running both locally, set:
```
NEXT_PUBLIC_MEDIALANE_BACKEND_URL=http://localhost:3001
```
(backend should be started with `PORT=3001` or vice versa)

## Architecture Overview

**Medialane** is a Starknet-based NFT marketplace and creator launchpad. It combines Web2 auth (Clerk) with Web3 wallet management (ChipiPay) for a gasless, abstracted blockchain UX.

### Key Integrations

- **Clerk** — Email/social authentication. Session JWTs are templated as `chipipay` for wallet derivation.
- **ChipiPay** (`@chipi-stack/nextjs`) — Manages Starknet wallets derived from Clerk sessions. Enables gasless transactions. Wraps the app via `ChipiProvider` in `src/app/providers.tsx`.
- **Starknet.js** — Direct contract calls. RPC singleton in `src/lib/starknet.ts`.
- **@medialane/sdk** — Published npm package (`@medialane/sdk@0.10.0`, org: `@medialane`). Provides `ApiOrder`, `ApiToken`, `ApiCollection`, `ApiOrderTokenMeta`, `ApiComment`, `OrderStatus`, `IpAttribute`, `IpNftMetadata`, `SupportedTokenSymbol` types and the SDK client used in `src/lib/medialane-client.ts`. `ApiOrder.token: ApiOrderTokenMeta | null` carries name/image/description enrichment from the backend — no per-row `useToken` calls needed. `ApiCollection.collectionId: string | null` is the on-chain registry numeric ID needed for `createMintIntent`. The SDK normalizes all addresses internally. `getListableTokens()` returns all tokens with `listable: true` (USDC, USDT, ETH, STRK, WBTC) — used by `listing-dialog` and `offer-dialog` to build currency lists. `SupportedCurrencySymbol` local type was removed in v0.4.2; use `SupportedTokenSymbol` from `@medialane/sdk` instead. `getTokenComments(contract, tokenId, opts?)` added in v0.4.8. `ApiCollection.standard: "ERC721" | "ERC1155" | "UNKNOWN"` added in v0.6.5. `Medialane1155Module` (`client.marketplace1155`) for ERC-1155 on-chain ops added in v0.6.8. `CreateListingIntentParams.amount?: string` for ERC-1155 multi-unit listings added in v0.6.9. `ApiCollectionProfile.slug: string | null` + `ApiCollectionSlugClaim` type + `checkCollectionSlugAvailability`, `submitCollectionSlugClaim`, `getMyCollectionSlugClaims`, `getCollectionBySlug` added in v0.10.0.
- **Pinata** — IPFS uploads via Next.js routes (all Clerk-gated, direct to Pinata):
  - `src/app/api/pinata/route.ts` — Universal digital asset upload. Accepts `file`, `name`, `description`, `external_url`, `creator` (wallet address), and full licensing schema (`ipType`, `licenseType`, `commercialUse`, `derivatives`, `attribution`, `geographicScope`, `aiPolicy`, `royalty`, `edition`). Uploads image then metadata JSON. Returns `{ uri, imageUri, cid }`. Metadata follows OpenSea ERC-721 standard with `attributes` array. Creator wallet embedded as `{ trait_type: "Creator", value: walletAddress }`.
  - `src/app/api/pinata/image/route.ts` — Image-only upload. Returns `{ imageUri: "ipfs://...", cid }`. Used by the create collection flow for the preview image.
  - `src/app/api/pinata/json/route.ts` — Generic JSON document upload. Accepts any JSON body. Returns `{ uri: "ipfs://...", cid }`. Used by the create collection flow to upload collection metadata JSON (`{ name, description, image, external_link }`) and set the resulting URI as `baseUri` for the on-chain collection.
  - `src/app/api/pinata/genesis/route.ts` — Genesis mint specific.

### Data Flow

1. User authenticates via Clerk → ChipiPay derives a Starknet wallet from the session
2. Session keys (SNIP-9) are stored in Clerk user metadata, managed via `use-session-key.ts`
3. **Wallet address**: always read from `useSessionKey().walletAddress` — never from `user.publicMetadata.publicKey` (Clerk server-only, returns `undefined` on the client). For components that only need identity, use `useWallet()` which wraps `useSessionKey()` with a normalized `{ address, isConnected }` interface.
4. **Asset uploads**: `POST /api/pinata` → image to Pinata → metadata JSON to Pinata → `ipfs://` URI → mint tx. Never goes through the backend. `PINATA_JWT` is consumed server-side in the Next.js route.
5. Marketplace orders use SNIP-12 typed data signing (see `use-marketplace.ts`)
6. Cart state is persisted to localStorage via Zustand (`use-cart.ts`)
7. Server state (tokens, collections, orders) fetched via SWR hooks in `src/hooks/` — **all** data comes from the backend API, no direct RPC calls except `useUserCollections` (needed for on-chain collection ID used in minting)

### Route Protection

`src/middleware.ts` (Clerk) guards `/portfolio` and `/create/*`. All other routes are public.

### Path Alias

`@/*` maps to `src/*` throughout the codebase.

## Environment Variables

Copy `.env.example` to `.env.local`. Required vars:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk auth |
| `NEXT_PUBLIC_CHIPI_API_KEY` | ChipiPay wallet service |
| `NEXT_PUBLIC_CLERK_TEMPLATE_NAME` | Must be `chipipay` |
| `NEXT_PUBLIC_MEDIALANE_BACKEND_URL` | Medialane API (default: `http://localhost:3001`) |
| `NEXT_PUBLIC_STARKNET_RPC_URL` | Starknet RPC endpoint |
| `NEXT_PUBLIC_MARKETPLACE_CONTRACT` | Marketplace contract address |
| `NEXT_PUBLIC_COLLECTION_CONTRACT` | Collection factory contract address |
| `PINATA_JWT` | Pinata IPFS upload auth |
| `NEXT_PUBLIC_PINATA_GATEWAY` | IPFS gateway URL |

## Pre-launch Genesis Mint (Homepage)

The homepage (`/`) shows the genesis launch mint event instead of the regular marketing page until further notice.

**Components:**
- `src/components/launch-mint.tsx` — Full launch page: NFT card with 3D tilt hover, mint flow, confetti success, per-user localStorage mint tracking
- `src/components/launch-countdown.tsx` — Animated countdown to March 14 2026 (switches to "Live on Starknet" after)

**Mint flow:** Sign in (Clerk) → create wallet if needed (`WalletSetupDialog`) → PIN dialog → `executeTransaction` with `mint_item(recipient, ByteArray(tokenURI))` → success/error state

**Required env vars to activate minting:**
```
NEXT_PUBLIC_LAUNCH_MINT_CONTRACT=0x...   # deployed genesis NFT contract
NEXT_PUBLIC_GENESIS_NFT_URI=ipfs://...   # pre-uploaded metadata CID
NEXT_PUBLIC_GENESIS_NFT_IMAGE_URL=       # optional: direct image URL for card preview
```
When `LAUNCH_MINT_CONTRACT` or `GENESIS_NFT_URI` are empty the button renders as "Mint opening soon" (disabled).

## Airdrop Campaigns

### Brazil Campaign (`/br/mint`)
Portuguese language. Files: `src/app/br/mint/br-mint-content.tsx` + `src/app/br/mint/page.tsx`.
Storage key: `ml_br_mint_${userId}`. Contract: `BR_MINT_CONTRACT`.
```
NEXT_PUBLIC_BR_MINT_CONTRACT=0x...
NEXT_PUBLIC_BR_NFT_URI=ipfs://...
NEXT_PUBLIC_BR_NFT_IMAGE_URL=     # optional direct image URL
```

### Global English Campaign (`/mint`)
English language, worldwide. Files: `src/app/mint/mint-content.tsx` + `src/app/mint/page.tsx`.
Storage key: `ml_mint_${userId}`. Contract: `MINT_CONTRACT`.
```
NEXT_PUBLIC_MINT_CONTRACT=0x...
NEXT_PUBLIC_MINT_NFT_URI=ipfs://...
NEXT_PUBLIC_MINT_NFT_IMAGE_URL=   # optional direct image URL
```
Mint flow: Sign in (Clerk) → create wallet if needed (inline WalletSetup) → PIN dialog → `executeTransaction` with `mint_item(recipient, ByteArray(tokenURI))` → success state.
When `MINT_CONTRACT` or `MINT_NFT_URI` are empty the CTA button is disabled.

## Key File Locations

- Contract addresses & RPC URL: `src/lib/constants.ts`
- Shared TypeScript types: `src/types/index.ts` + `@medialane/sdk`
- Global CSS variables (HSL theme tokens): `src/app/globals.css`
- App shell (sidebar, top bar, theme, toast): `src/app/providers.tsx`

## UI Conventions

- Component library: **shadcn/ui** (Radix UI primitives) in `src/components/ui/`
- Styling: Tailwind CSS with CSS variable-based HSL color tokens; dark mode via `class` strategy
- Icons: `lucide-react`
- Animations: Framer Motion + `tailwindcss-animate`
- Toast notifications: `sonner`
- Custom utility classes (`.glass`, `.gradient-text`, `.asset-card-hover`) defined in `globals.css`

---

## Architecture: Data Flow & Hooks

### Read data (SWR hooks — `src/hooks/`)
| Hook | Data | Source |
|---|---|---|
| `useToken(contract, tokenId)` | Single token + metadata | `GET /v1/tokens/:contract/:tokenId` |
| `useTokensByOwner(address)` | All tokens for a wallet | `GET /v1/tokens/owned/:address` |
| `useTokenHistory(contract, tokenId)` | Transfer + order events | `GET /v1/tokens/:contract/:tokenId/history` |
| `useOrders(query)` | Orders (filter by status/sort/currency) | `GET /v1/orders` |
| `useOrder(orderHash)` | Single order | `GET /v1/orders/:orderHash` |
| `useTokenListings(contract, tokenId)` | Active orders for token | `GET /v1/orders/token/:contract/:tokenId` |
| `useUserOrders(address)` | All orders (buy+sell) for user | `GET /v1/orders/user/:address` |
| `useCollections(page, limit, isKnown?, sort?)` | All collections with sort/filter | `GET /v1/collections` (direct fetch, bypasses SDK — supports `sort` param without requiring SDK publish) |
| `useCollection(contract)` | Single collection | `GET /v1/collections/:contract` |
| `useCollectionTokens(contract)` | Tokens in collection | `GET /v1/collections/:contract/tokens` |
| `useCollectionsByOwner(address)` | Collections owned by address (API-based, returns `collectionId`) | `GET /v1/collections?owner=address` via SDK client. Used in portfolio/collections and create/asset collection selector |
| `useUserCollections(address)` | Collections owned by address (on-chain direct, returns `onChainId`) | Calls `list_user_collections()` + `get_collection()` on registry contract via starknet.js. **Only use this if you specifically need `onChainId` and `useCollectionsByOwner` can't provide `collectionId`** |
| `useActivities(query)` | Global activity feed | `GET /v1/activities` |
| `useActivitiesByAddress(address)` | User activity | `GET /v1/activities/:address` |
| `useComments(contract, tokenId)` | On-chain comments for a token | `GET /v1/tokens/:contract/:tokenId/comments` via SDK |
| `useGatedContent(contract?)` | Gated content for collection holders | `GET /v1/collections/:contract/gated-content` via direct fetch (Clerk JWT) |

### Write operations (via `useMarketplace`)
All write ops follow: create intent → sign typed data → submit signature → execute calls via ChipiPay.
- `createListing(input)` → SNIP-12 listing intent → calls `createListingIntent` + `submitIntentSignature`
- `makeOffer(input)` → SNIP-12 offer intent
- `fulfillOrder(input)` → Buy listing — simplest: `createFulfillIntent` returns pre-signed calls
- `cancelOrder(input)` → Cancel SNIP-12

**Stale order sync**: after every write op, `setTimeout(() => invalidate(), 10000)` fires a delayed revalidation to ensure UI reflects on-chain state after the indexer processes the block (~6s poll cycle). SWR hooks poll at `refreshInterval: 60_000` (reduced from 20–30s in 2026-05-12). `mutate()` covers the writing user's own actions; polling covers cross-user updates and indexer lag.

### Wallet & session (`use-session-key.ts`)
- `walletAddress` — user's Starknet address (from ChipiPay)
- `hasWallet` / `hasActiveSession` — gate wallet setup/session dialogs
- `setupSession(pin)` — creates SNIP-9 session key on-chain (6-hour validity)
- `signTypedData(typedData, pin)` — signs with session key or owner key

### Cart (Zustand, localStorage)
- `useCart()` — `{ items, isOpen, addItem, removeItem, clearCart, toggleCart }`
- Cart items persist across page reloads via `persist` middleware (key: `medialane-io-cart`)
- No batch checkout flow yet — items must be purchased individually

---

## Known Bugs (as of 2026-05-12)

All previously noted bugs were fixed. No outstanding known bugs.

**Fixed in 2026-05-12 session:**
- ERC-20 `balanceOf` RPC error (`-32602: Invalid block id`) on asset pages. Root cause: `starknetProvider.callContract` was called without a `block_id`, defaulting to `"pending"` which some RPC providers reject. Fixed: pass `"latest"` as second arg.
- Per-row `useTokenBalance` in `ReceivedOfferRow` fired on page load for every offer row. Fixed: balance check deferred inside `useAcceptOffer` — fires only after user clicks Accept.
- Custom traits with the same `traitType` name were silently dropped on mint. Root cause: `ip-type-fields.tsx` ran all traits through a `seen` Set meant for template field deduplication. Fixed: custom traits bypass the `seen` check.

**Fixed in 2026-04-30 session:**
- Cancel/accept bid order sent `tokenStandard: "ERC20"` to the backend. Root cause: `use-order-actions.ts` used `order.offer.itemType` as fallback — for bid orders `offer.itemType` is `"ERC20"` (currency). Fixed by deriving the NFT standard correctly: `consideration.itemType` for bids, `offer.itemType` for listings. This fix covers both cancel and accept paths.
- Remix flow broken for ERC-1155 collections: collection selector filtered them out (`collectionId != null`), mint used ERC-721 `createMintIntent`, listing search hardcoded `offer.itemType === "ERC721"`. Fully fixed — see remix section in Implementation Backlog.
- Owner remix page never created a marketplace listing even when price was entered — silent gap fixed.

**Fixed in 2026-03-12 session (backend):**
- Collections created via the frontend could get stuck with `metadataStatus: "PENDING"`, `description: null`, `image: null`, `totalSupply: 0` if the `COLLECTION_METADATA_FETCH` job failed to process. Root cause: the job could exhaust retries without updating the collection status, and `STATS_UPDATE` was never enqueued from within `handleCollectionMetadataFetch`. Fixed in `medialane-backend`: `handleCollectionMetadataFetch` now enqueues a `STATS_UPDATE` after success; admin `/refresh` endpoint uses `normalizeAddress` and also enqueues `STATS_UPDATE`; new `POST /admin/collections/:contract/stats-refresh` endpoint added for on-demand stats sync.

**Fixed in 2026-03-11 session:**
- Marketplace currency filter: was passing token symbol to API instead of token address. Fixed with `getTokenBySymbol(currency)?.address`.
- Marketplace price filter: was passing human-readable amounts (e.g. "1") instead of wei. Fixed with `parseAmount(value, decimals)` where decimals come from `getTokenBySymbol(currency)?.decimals ?? 18`.
- Collections page was sorting by `totalSupply DESC` (oldest/largest first). Now defaults to `createdAt DESC` (newest first).

---

## Implementation Backlog (prioritized)

### P0 — Bugs to fix first
- [x] Asset page: wrap history section in `container mx-auto px-4` ✓ 2026-03-06
- [x] Asset page: implement Tabs layout (Details | Listings | History) ✓ 2026-03-06
- [x] Asset page: add Cancel button for owner's own listing ✓ 2026-03-06

### P1 — Core missing features
- [x] Asset page: show all listings in "Listings" tab (not just cheapest) ✓ 2026-03-06
- [x] Portfolio listings table: fetch token metadata for name/image display ✓ 2026-03-06
- [x] Portfolio offers table: add Cancel button + token name/image ✓ 2026-03-06
- [x] Portfolio restructured: tabs → subpages (`/portfolio/assets`, `/portfolio/collections`, etc.) ✓ 2026-03-07
- [x] Portfolio collections page: shows user-owned collections via `useCollectionsByOwner` (API-based) ✓ 2026-03-09
- [x] Create asset page: collection selector using `useCollectionsByOwner` (API-based, `col.collectionId` passed to `createMintIntent`) ✓ 2026-03-09
- [x] Asset page: incoming offers section + Offers tab with Accept flow ✓ 2026-03-06
- [x] Marketplace: "Load more" pagination (PAGE_SIZE=12, appends pages) ✓ 2026-03-06

### P2 — Polish
- [x] Token attributes (traits) grid in asset page ✓ 2026-03-06
- [x] Image `onError` fallback in `ListingCard` and asset page ✓ 2026-03-06
- [x] Session key expiry warning (sticky banner, < 30 min remaining) ✓ 2026-03-06
- [x] Search results page `/search?q=...` (Enter in marketplace SearchBar navigates here) ✓ 2026-03-06

### P3 — Nice to have
- [x] Cart batch checkout flow (buy multiple items in one session, single PIN) ✓ 2026-03-06
- [x] Offer browsing in marketplace (Type filter: All / Listings / Offers) ✓ 2026-03-06
- [ ] Price range filter in marketplace (requires backend min/max params — deferred)
- [x] Sidebar-first layout: shadcn `sidebar-07` replaces top header globally ✓ 2026-03-06
- [x] `@medialane/sdk` published to npm — replaced local `file:` dep ✓ 2026-03-06 (latest: v0.10.0)
- [x] batchTokenMeta: order endpoints return `token.{name,image,description}` — eliminates N+1 `useToken` calls ✓ 2026-03-07
- [x] Stale order sync: refreshInterval + delayed invalidate after write ops ✓ 2026-03-07
- [x] Collection image upload in create flow (`/api/pinata/image`) + image stored in intent typedData ✓ 2026-03-07
- [x] Collection metadata JSON uploaded to IPFS on collection creation (`/api/pinata/json`) → `baseUri` set on-chain so `dapp.medialane.io` resolves collection images permissionlessly ✓ 2026-03-16
- [x] External link fields: `external_link` in create collection form, `external_url` in create asset form — both optional, validated as http/https URLs ✓ 2026-03-16
- [x] Creator wallet address embedded in asset IPFS metadata attributes (`{ trait_type: "Creator", value: walletAddress }`) — sourced from `useSessionKey().walletAddress` ✓ 2026-03-16
- [x] Full programmable licensing metadata (Berne Convention, CC variants, AI policy, royalty) ✓ 2026-03-06
- [x] Asset page License tab — rich display from IPFS attributes (Berne badge, icon table) ✓ 2026-03-06
- [x] Asset upload decentralised — direct Pinata via `/api/pinata`, no backend hop ✓ 2026-03-06
- [x] Platform hardening: all portfolio pages use `useSessionKey()` for wallet address — no more `publicMetadata.publicKey` reads ✓ 2026-03-09
- [x] `use-chipi-transaction.ts` reads wallet keys from `useChipiWallet` (not Clerk metadata) ✓ 2026-03-09
- [x] `<EmptyOrError>` component: single component for loading/error/empty states across all portfolio pages ✓ 2026-03-09
- [x] Global SWR `onError` handler: sonner toast on any API failure — users always see errors ✓ 2026-03-09
- [x] `useCollectionsByOwner` uses SDK client (not raw fetch); `useCollectionsByOwner` used in create/asset for collection selector ✓ 2026-03-09
- [x] Backend address normalization: full 64-char pad applied in all route handlers ✓ 2026-03-09
- [x] SDK v0.3.0/0.3.1: normalizes addresses internally; `ApiCollection.collectionId` added ✓ 2026-03-09
- [x] Marketplace currency + price filters fixed (symbol→address, human→wei conversion) ✓ 2026-03-11
- [x] Collections page: sort/filter toolbar (Recent/Supply/Volume/Floor/Name + Verified toggle), newest-first default ✓ 2026-03-11
- [x] Creator page (`/creator/[address]`): full redesign — address-derived color palette, blurred banner from latest token image, asset avatar, activity timeline ✓ 2026-03-11
- [x] `/docs` folder removed from git tracking (gitignored) — internal planning docs no longer exposed in repo ✓ 2026-03-11
- [x] Currency expansion: WBTC + ETH added to listing/offer dialogs; USDC.e removed; token list centralized in SDK via `getListableTokens()` ✓ 2026-03-17
- [x] IP Types & Templates: 12 canonical IP types (Audio, Art, Video, Photography, NFT, Patents, Posts, Publications, Documents, RWA, Software, Custom); dynamic template fields per type; Media tab on asset page with embed players ✓ 2026-03-20
- [x] UI polish: removed duplicate floating buy button on mobile asset page; homepage full-width (removed max-w-7xl); creators page title "Meet the Creators" + friendlier subtitle; creator cards redesigned — larger avatar (h-14), 4-col grid, collection image fallback for creators without banner/avatar ✓ 2026-03-20
- [x] ChipiPay wallet panel: upgraded @chipi-stack/nextjs to v14; new ChipiWalletPanel component + use-wallet-with-balance hook; passkey support ✓ 2026-03-20
- [x] Unified TokenCard: single modular component across all pages — solid brand-colored buttons (rounded-[11px], hover:brightness-110) matching asset page; title text-xl font-bold; creator attribution from IPFS attributes; ownership auto-detected per-token via token.owner vs walletAddress ✓ 2026-04-06
- [x] Cart redesigned as centered Dialog with blurred backdrop (backdrop-blur-[48px]) — item thumbnails, individual Buy buttons, "Buy all N items" batch checkout, Clear all, responsive max-w-sm/md ✓ 2026-04-06
- [x] Collection page: ownership detection per token — owners see List/Cancel/Transfer dialogs directly from the Items grid ✓ 2026-04-06
- [x] Creator page carousel: w-64 cards (~4.5 visible), CollectionCard (aspect-[3/4]) as cover instead of custom square ✓ 2026-04-06
- [x] IpTypeBadge component on token cards — top-left overlay from token.metadata.ipType ✓ 2026-04-06
- [x] Service-specific asset pages: dispatcher (`asset-page-client.tsx`) routes by `collection.source` + `collection.standard` → POP Protocol (soulbound/claim-only), Collection Drop (drop panel + secondary market), NFT Edition ERC-1155 (multi-edition stats + holders grid), Standard ERC-721 (full IP + remix) ✓ 2026-04-24
- [x] Launchpad service cards redesigned: flat dark `bg-card border border-border/40`, brand-colored icons (`BRAND.*`), solid brand-color CTA buttons, 1-col mobile / 2-col tablet / 3-col desktop grid — same aesthetic carried into homepage Creator Launchpad strip ✓ 2026-04-24
- [x] `/launchpad/ip1155` renamed to `/launchpad/nfteditions` — git mv with history preserved ✓ 2026-04-24
- [x] `useOrderActions` hook + `CancelListingDialog` component — cancel/accept state machine extracted from all three asset page variants (standard, drop, edition); edition page passes `tokenStandard: "ERC1155"` ✓ 2026-04-24
- [x] SDK v0.8.0: immutable contract redeployments (ERC-721 + ERC-1155 marketplaces, NFTComments); `NFTCOMMENTS_CONTRACT_MAINNET` exported; `INDEXER_START_BLOCK_MAINNET` → 9130000; `COMMENTS_CONTRACT` falls back to SDK constant ✓ 2026-04-25
- [x] `MedialaneClient` singleton now explicitly passes all three contracts (`marketplaceContract`, `marketplace1155Contract`, `collectionContract`) instead of relying on SDK defaults for ERC-1155 and collection ✓ 2026-04-25
- [x] Purchase/offer/listing/cancel dialogs: image fade overlay removed (no color wash over creator work); buy-now CTA upgraded to `btn-border-animated` gradient button; mobile 6px margin (`max-w-[calc(100%-12px)]`) + `rounded-2xl` so blurred background peeks through on mobile ✓ 2026-04-25
- [x] Global English airdrop page `/mint` — port of `/br/mint` in English; uses `MINT_CONTRACT`, `MINT_NFT_URI`, `MINT_NFT_IMAGE_URL`; storage key `ml_mint_${userId}` ✓ 2026-04-25
- [x] Comments "Post onchain" button: tooltip explains unavailability when `COMMENTS_CONTRACT` is not set, instead of silently staying disabled ✓ 2026-04-25

### 2026-04-30 session — marketplace audit fixes + remix ERC-1155 upgrade

**Marketplace audit fixes (IO-* issues from 2026-04-27 audit):**
- [x] IO-1: `collection1155Contract: COLLECTION_1155_CONTRACT` added to `MedialaneClient` constructor in `src/lib/medialane-client.ts` ✓ 2026-04-30
- [x] IO-2: `invalidatePortfolioCache(walletAddress)` added after ERC-1155 collection deploy (`/launchpad/nfteditions/create`) and after ERC-1155 mint (`/launchpad/nfteditions/[contract]/mint`) ✓ 2026-04-30
- [x] IO-3: `amount` defaults to `"1"` in `use-marketplace.ts` `createListing` when falsy for ERC-1155 ✓ 2026-04-30
- [x] IO-4: Quantity field added to `offer-dialog.tsx` for ERC-1155 tokens; `MakeOfferInput.quantity` added to `use-marketplace.ts` ✓ 2026-04-30
- [x] IO-5: `invalidatePortfolioCache` called after ERC-1155 mint success ✓ 2026-04-30
- [x] IO-6: `usePostMintListing` accepts and forwards `tokenStandard` prop ✓ 2026-04-30
- [x] IO-7: `standardResolved` in `listing-dialog.tsx` now correctly treats `"UNKNOWN"` as unresolved (button stays disabled) ✓ 2026-04-30

**Marketplace dialog refactor:**
- [x] `marketplace-dialog-primitives.tsx` created — 9 shared components (`MarketplaceSuccessState`, `MarketplaceActivatingSession`, `MarketplaceSignInGate`, `MarketplaceDialogHero`, `MarketplacePinStep`, `MarketplaceTxLink`, `MarketplaceProcessingState`, `CurrencyPicker`, `DurationPicker`) ✓ 2026-04-30
- [x] `listing-dialog.tsx` refactored from ~515 to ~290 lines using primitives ✓ 2026-04-30
- [x] `offer-dialog.tsx` refactored from ~435 to ~270 lines using primitives ✓ 2026-04-30
- [x] `src/lib/cairo-calldata.ts` extracted — `serializeByteArray()` and `encodeU256()` shared across launchpad, remix, and approve flows ✓ 2026-04-30

**Cancel/accept bid order fix:**
- [x] `use-order-actions.ts`: derive NFT standard correctly for cancel and accept — bid orders use `consideration.itemType`; listing orders use `offer.itemType`. Prevents `tokenStandard: "ERC20"` being sent to backend ✓ 2026-04-30

**`useMarketplaceActionFlow` hook:**
- [x] Extracted shared PIN/passkey/session activation state machine from `listing-dialog` and `offer-dialog` into `src/hooks/use-marketplace-action-flow.ts` — covers wallet setup, session refresh, PIN entry, passkey auth, and action execution ✓ 2026-04-30

**Remix flow — full ERC-1155 support:**
- [x] `create/remix/page.tsx`: collection selector now includes ERC-1155 collections (key = `collectionId ?? contractAddress`); mint branches on `collection.standard`: ERC-1155 calls `mint_item` directly with `Date.now()` tokenId (no registry poll needed), ERC-721 keeps `createMintIntent` path; owner path now creates marketplace listing when price is entered ✓ 2026-04-30
- [x] `approve-mint-sheet.tsx`: same ERC-1155 mint branch; `createListing` passes `tokenStandard`/`amount` for ERC-1155; listing search uses `collection.standard` as `itemType` filter instead of hardcoded `"ERC721"`; collection selector shows ERC-721/ERC-1155 badge ✓ 2026-04-30
- [x] Collection selector in both remix files shows `ERC-721` / `ERC-1155` label per collection ✓ 2026-04-30

**Dead code removal + debug cleanup:**
- [x] `src/components/asset/remix-offer-dialog.tsx` deleted — orphaned, never imported ✓ 2026-04-30
- [x] `src/components/asset/self-remix-dialog.tsx` deleted — superseded by full `/create/remix` page flow ✓ 2026-04-30
- [x] `MarketplaceDebugPanel` removed from `listing-dialog.tsx` (3 instances) and `create/asset/page.tsx` ✓ 2026-04-30

### 2026-05-07 session — airdrop pages redesign + Unicode encoding fix

**Airdrop pages redesign (`/mint`, `/br/mint`, `/airdrop`):**
- [x] All three pages use `max-w-5xl` containers with multi-column desktop grids ✓ 2026-05-07
- [x] `/mint` + `/br/mint` hero: left = badge → H1 → `<GenesisMint />` → description; right = genesis NFT image (sticky on desktop) ✓ 2026-05-07
- [x] Participation section reframed: "Sign up — you're in" as big green base tier; Create and Trade/Collect shown as bonus tiers (not steps) — removed invented 4-step flow ✓ 2026-05-07
- [x] `/airdrop` hero: left = badge → H1 → description → content-type chips; right = `<GenesisMint />` + genesis image (sticky) ✓ 2026-05-07
- [x] `/airdrop` header stripped to logo only — no nav or CTA buttons (claim is inline) ✓ 2026-05-07
- [x] Benefits section renamed "Airdrop rewards / What early participants earn"; removed misleading "Full platform access" card; replaced with "Founding member status" ✓ 2026-05-07
- [x] Eligibility section replaced with cleaner "Participation rules" split: "Who can join" (green) vs "What gets you removed" (red) ✓ 2026-05-07
- [x] All incorrect content removed: annual cycle, DAO/governance/MDLN jargon ✓ 2026-05-07

**Shared airdrop component (`src/components/airdrop/genesis-mint.tsx`):**
- [x] Extracted `WalletSetup` + `GenesisMint` + `AirdropEventCard` into shared component ✓ 2026-05-07
- [x] `/mint`, `/airdrop` both import from this shared file — no duplication ✓ 2026-05-07

**Unicode encoding fix (`serializeByteArray`):**
- [x] `src/lib/cairo-calldata.ts`: replaced starknet.js `byteArrayFromString` (ASCII-only) with `TextEncoder`-based UTF-8 packer — supports any language, accented chars, CJK, emoji ✓ 2026-05-07
- [x] All four direct `byteArray.byteArrayFromString` calls in mint flows migrated to `serializeByteArray`: `genesis-mint.tsx`, `br-mint-content.tsx`, `launch-mint.tsx` ✓ 2026-05-07
- [x] Fixes ERC-1155 collection creation failure for names with non-ASCII characters (e.g. "Nó Samsara") ✓ 2026-05-07
- [x] Symbol field `^[A-Z0-9]+$` intentionally kept ASCII — on-chain ticker symbols are ASCII by convention ✓ 2026-05-07

### 2026-05-12 session — accept-offer refactor, RPC fix, UX feedback batch

**Unified accept-offer flow:**
- [x] `src/hooks/use-accept-offer.ts` created — wraps `useMarketplaceActionFlow<ApiOrder>`, calls `useTokenBalance` only after order selected (deferred, not on page load). Exports `AcceptOfferHook = ReturnType<typeof useAcceptOffer>` ✓ 2026-05-12
- [x] `src/components/marketplace/accept-offer-dialog.tsx` created — PIN/passkey/session/processing/success/error states using primitives; amber balance warning when buyer has insufficient funds ✓ 2026-05-12
- [x] `accept-offer-result-dialog.tsx` deleted — replaced by `AcceptOfferDialog` ✓ 2026-05-12
- [x] All three asset page variants (`asset-page-standard`, `asset-page-edition`, `asset-page-drop`) + `portfolio/received-offers-table` migrated to `useAcceptOffer` + `AcceptOfferDialog` ✓ 2026-05-12
- [x] Per-row `useTokenBalance` calls removed from `ReceivedOfferRow` — balance check now fires only when user clicks Accept ✓ 2026-05-12

**ERC-20 `balanceOf` RPC fix:**
- [x] `use-erc20-balance.ts`: pass `"latest"` as second arg to `starknetProvider.callContract` — fixes `Invalid block id` error that fired on every asset page load ✓ 2026-05-12

**SWR polling optimization:**
- [x] `use-comments.ts`: `refreshInterval: 15000 → 60_000`; `use-tokens.ts`: `useTokensByOwner` `refreshInterval: 12000 → 60_000`; `use-collections.ts`: `useCollectionsByOwner` `refreshInterval: 12000 → 60_000`; `use-orders.ts`: all hooks `refreshInterval: 20000 → 60_000`, `dedupingInterval: 5000 → 10_000` ✓ 2026-05-12

**User feedback batch (5 items):**
- [x] Launchpad: "Mint NFT" → "Mint singular NFT" (title + button); "Limited Editions" → "Limited Editions Collections" in `launchpad-content.tsx` ✓ 2026-05-12
- [x] Custom trait dedup bug fixed: `ip-type-fields.tsx` — custom traits with the same name no longer silently drop; only template fields deduplicate via `seen` Set ✓ 2026-05-12
- [x] Cancel button removed from `TokenCard` (confusing users) — owners see "Listed" label instead; cancel remains on the asset page. Dead cancel state removed from `creator-page-client.tsx` and `collection-page-client.tsx` ✓ 2026-05-12
- [x] `CancelListingDialog` upgraded to use `MarketplaceProcessingState`/`SuccessState`/`ErrorState` primitives with `tokenName`/`tokenImage`; all callers updated (`asset-marketplace-dialogs`, `asset-page-drop`, `listing-card`) ✓ 2026-05-12
- [x] ERC-1155 listing dialog: "You own N" hint next to Qty label — `quantityOwned` prop added to `ListingDialog`; `asset-page-edition` computes it from `token.balances` and threads it through `AssetMarketplaceDialogs` ✓ 2026-05-12

### 2026-05-06 session — ownership UX, dialog polish, creator images

**Ownership-aware listing surfaces:**
- [x] `listing-card.tsx`: `isOwner` prop — owners see orange "Cancel" button (triggers inline cancel flow) instead of Buy/Cart. Passkey users get immediate cancel on click; PIN users get the PIN dialog. ✓ 2026-05-06
- [x] `listings-grid.tsx`: detects ownership via `walletAddress` vs `order.offerer`, passes `isOwner` to `ListingCard` ✓ 2026-05-06
- [x] `collection-page-client.tsx`: same `isOwner` detection for listings and bids tabs ✓ 2026-05-06
- [x] `new-on-marketplace.tsx` (homepage "New listings"): same `isOwner` detection — owners see Cancel, not Buy ✓ 2026-05-06

**PIN/passkey gating fix:**
- [x] All five marketplace dialogs (`listing`, `offer`, `purchase`, `cancel-order`, `transfer`): `passkeySupported` now gated as `isWebAuthnSupported() && !!encryptKey` — only shows passkey option if the user actually enrolled a passkey at onboarding ✓ 2026-05-06

**Launchpad error/success screens:**
- [x] `LaunchpadErrorState` component added to `launchpad-success-state.tsx` — full-page error screen matching `LaunchpadSuccessState` layout ✓ 2026-05-06
- [x] `launchpad/drop/create` and `launchpad/pop/create`: tx errors now render `LaunchpadErrorState` (full page) instead of silent toast ✓ 2026-05-06
- [x] `launchpad/drop/[contract]/manage` and `launchpad/pop/[contract]/manage`: results shown in a Dialog with success/error states instead of fleeting toasts ✓ 2026-05-06

**Cancel listing dialog:**
- [x] `listing-card.tsx` PIN dialog: added `MarketplaceDialogHero` (asset image) + asset name + price above the PIN input — matches visual style of all other marketplace dialogs ✓ 2026-05-06

**Discover creator images:**
- [x] `creators-strip.tsx`: maps `collectionImage` as fallback for `bannerImage`/`avatarImage` before passing to `DiscoverCreatorsStrip` — fixes blank creator cards for creators who haven't set a profile image ✓ 2026-05-06

---

## App Shell Architecture (as of 2026-03-06)

The app uses a **shadcn `sidebar-07` layout** as the global shell — no top `Header` component exists.

```
layout.tsx (server)
  └─ ClerkProvider > ChipiProvider
       └─ Providers (client) — src/app/providers.tsx
            └─ ThemeProvider > SWRConfig (global onError → sonner toast) > SidebarProvider
                 ├─ AppSidebar — src/components/layout/app-sidebar.tsx
                 │    Brand logo + Platform nav (Marketplace/Collections/Portfolio/Launchpad/Activity) — /create removed from nav (redirects to /launchpad)
                 │    + Clerk user (UserButton + name/email) in SidebarFooter
                 │    collapsible="icon" — collapses to icons on desktop, Sheet on mobile
                 └─ SidebarInset
                      ├─ sticky h-12 top bar: SidebarTrigger + search + theme + cart + auth
                      ├─ SessionExpiryBanner (fixed bottom-4 right-4, dismissible toast)
                      └─ <main> — page content
            (outside SidebarInset) CartDrawer + Toaster
```

**Key rules:**
- Never nest `SidebarProvider` inside a page — it's global in `providers.tsx`
- `UserButton` from Clerk must NOT be wrapped in `SidebarMenuButton` (button-in-button → React error #130)
- `SessionExpiryBanner` is a fixed bottom-4 right-4 dismissible toast. Dismissed state stored in sessionStorage key "session-banner-dismissed".
- Marketplace filters are an inline horizontal toolbar (no sidebar) — Sort/Type/Currency chips

---

## Key File Locations (complete)

| Path | Purpose |
|---|---|
| `src/lib/constants.ts` | All env vars + contract addresses |
| `src/lib/medialane-client.ts` | SDK singleton (MedialaneClient) — explicitly sets `marketplaceContract`, `marketplace1155Contract`, `collectionContract`, `collection1155Contract` |
| `src/lib/cairo-calldata.ts` | Cairo calldata helpers: `serializeByteArray(str)` → `string[]` for Cairo ByteArray (UTF-8 safe, supports any Unicode); `encodeU256(n: bigint)` → `[low, high]`. Use these instead of manual felt encoding anywhere mint/transfer calldata is built. Never use starknet.js `byteArrayFromString` directly — it is ASCII-only. |
| `src/components/airdrop/genesis-mint.tsx` | Shared airdrop components: `GenesisMint` (full claim flow — sign-in gate, wallet setup, PIN, mint, success/error), `AirdropEventCard` (genesis NFT image with fallback). Used by `/mint` and `/airdrop`. |
| `src/lib/utils.ts` | `ipfsToHttp`, `timeUntil`, `formatPrice`, `cn` |
| `src/types/index.ts` | Local TypeScript types (CartItem, etc.) |
| `src/types/ip.ts` | IP/licensing constants: `LICENSE_TYPES`, `IP_TYPES`, `GEOGRAPHIC_SCOPES`, `AI_POLICIES`, `DERIVATIVES_OPTIONS`, `LICENSE_TRAIT_TYPES` |
| `src/app/api/pinata/route.ts` | Universal digital asset upload (Clerk-gated, direct Pinata) — accepts image + full licensing schema + `creator` wallet + `external_url`, returns `{ uri, imageUri, cid }`. Embeds creator as attribute. |
| `src/app/api/pinata/image/route.ts` | Image-only upload (Clerk-gated, direct Pinata) — returns `{ imageUri: "ipfs://...", cid }`. Used by create collection flow |
| `src/app/api/pinata/json/route.ts` | Generic JSON document upload (Clerk-gated, direct Pinata) — returns `{ uri: "ipfs://...", cid }`. Used by create collection flow to anchor collection metadata on-chain as `baseUri` |
| `src/app/portfolio/layout.tsx` | Portfolio shared layout: auth guard, wallet display, subnav with 6 links + unread badge |
| `src/hooks/use-collections.ts` | `useCollections`, `useCollection`, `useCollectionTokens`, `useCollectionsByOwner` |
| `src/hooks/use-user-collections.ts` | `useUserCollections(address)` — on-chain direct via starknet.js; returns `{ onChainId, contractAddress, name, symbol }[]`. Used by portfolio/collections and create/asset collection selector |
| `src/app/globals.css` | HSL theme tokens, `.glass`, `.gradient-text` |
| `src/app/providers.tsx` | Global shell: SidebarProvider + AppSidebar + SidebarInset + top bar |
| `src/components/layout/app-sidebar.tsx` | Shadcn sidebar: brand, nav, Clerk user footer |
| `src/components/layout/cart-drawer.tsx` | Cart as centered Dialog (not Sheet) — blurred backdrop, item thumbnails, batch checkout |
| `src/components/shared/token-card.tsx` | **Unified modular asset card** — used on all pages; brand buttons; ownership-aware |
| `src/components/creator/collection-carousel-row.tsx` | Horizontal drag carousel for creator profile — w-64 cards, CollectionCard cover |
| `src/middleware.ts` | Clerk route protection (/portfolio, /create/*) |
| `src/hooks/use-comments.ts` | `useComments(contract, tokenId)` SWR hook — fetches via SDK `getTokenComments()` |
| `src/hooks/use-gated-content.ts` | `useGatedContent(contract?)` — discriminated union state hook for holder-only content (`not_signed_in \| loading \| not_holder \| unlocked \| error`) |
| `src/components/collection/gated-content-hero.tsx` | Gated content banner on collection page — animated gradient border (locked) or green unlocked state; shown to all visitors |
| `src/components/collection/owner-setup-panel.tsx` | Setup checklist for collection owners (display name, description, cover/banner, social links, exclusive content) — shown only to the owner on the collection page; disappears when all items complete |
| `src/app/portfolio/collections/[contract]/settings/page.tsx` | Collection settings: identity, media, exclusive content, social links, **slug claim UI** (availability check → submit → pending/active states) |
| `src/app/collection/[slug]/page.tsx` | Slug-based routing — server page that resolves vanity slug via `GET /v1/collections/by-slug/:slug` and redirects to `/collections/:contract` |
| `src/components/asset/comments-section.tsx` | Messenger-style chat bubble panel (480px fixed height). Own comments right-aligned, others left with gradient avatar. Per-comment Voyager link. Enhanced compose bar with "Post on-chain" CTA. |
| `src/app/api/reports/route.ts` | Reports proxy to backend — handles `COMMENT` type, builds `COMMENT::<commentId>` targetKey |
| `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx` | Dispatcher: `detectAssetType(source, standard)` → routes to pop/drop/edition/standard |
| `src/app/asset/[contract]/[tokenId]/asset-page-pop.tsx` | POP Protocol view — soulbound credential, emerald theme, claim-only |
| `src/app/asset/[contract]/[tokenId]/asset-page-drop.tsx` | Collection Drop view — drop info panel (supply, window, price), secondary market |
| `src/app/asset/[contract]/[tokenId]/asset-page-edition.tsx` | NFT Edition ERC-1155 view — edition stats, holders grid, full marketplace |
| `src/app/asset/[contract]/[tokenId]/asset-page-standard.tsx` | Standard ERC-721 view — IP + license + remix + marketplace tabs |
| `src/app/asset/[contract]/[tokenId]/use-order-actions.ts` | Shared cancel/accept order state machine. Derives NFT standard correctly: `consideration.itemType` for bid orders, `offer.itemType` for listings. Optional `tokenStandard` prop overrides both (used by ERC-1155 edition page). |
| `src/app/asset/[contract]/[tokenId]/cancel-listing-dialog.tsx` | Shared cancel status dialog (processing/success/error) |
| `src/hooks/use-session-key.ts` | Wallet derivation + SNIP-9 session key. Returns `walletAddress` via 3-tier fallback: ChipiPay API → Clerk JWT claim → backend DB. |
| `src/hooks/use-wallet.ts` | **Normalized identity hook** — wraps `useSessionKey()`, returns `{ address, isConnected }`. Use in any component that only needs to know who the user is. Same interface as `useWallet()` in medialane-dapp. |
| `src/hooks/use-rewards.ts` | `useRewards(address)` + `useLeaderboard(page, limit)` — SWR hooks for XP scores and leaderboard from `GET /v1/rewards/*` |
| `src/components/rewards/level-badge.tsx` | Color-coded level chip: `Lv.N Name`. Size: sm/md/lg. |
| `src/components/rewards/badge-shelf.tsx` | Row of earned badge chips with lazy Lucide icons and tooltips. |
| `src/app/rewards/rewards-dashboard.tsx` | My Rank tab + Leaderboard tab. Uses `useWallet()` — identical to medialane-dapp version. |
| `src/hooks/use-marketplace.ts` | All marketplace write operations |
| `src/hooks/use-chipi-transaction.ts` | ChipiPay tx execution + status |
| `src/hooks/use-cart.ts` | Zustand cart store |
| `src/components/marketplace/marketplace-dialog-primitives.tsx` | Shared marketplace dialog building blocks: `MarketplaceSuccessState`, `MarketplaceActivatingSession`, `MarketplaceSignInGate`, `MarketplaceDialogHero`, `MarketplacePinStep`, `MarketplaceTxLink`, `MarketplaceProcessingState`, `CurrencyPicker`, `DurationPicker` |
| `src/components/marketplace/purchase-dialog.tsx` | Buy/fulfill flow |
| `src/components/marketplace/listing-dialog.tsx` | Create listing flow — uses `marketplace-dialog-primitives`. No `MarketplaceDebugPanel` in production. |
| `src/components/marketplace/offer-dialog.tsx` | Make offer flow — includes quantity field for ERC-1155 |
| `src/hooks/use-marketplace-action-flow.ts` | Shared PIN/passkey/session activation state machine for marketplace dialogs. Handles wallet-setup gate, session refresh (with amount-cap clear), PIN entry, passkey auth, and action execution. Used by listing-dialog and offer-dialog. |
| `src/hooks/use-remix-offers.ts` | SWR hooks + mutation helpers for remix offer lifecycle: `useRemixOffers`, `useTokenRemixes`, `submitRemixOffer`, `submitAutoRemixOffer`, `confirmSelfRemix`, `confirmRemixOffer`, `rejectRemixOffer`, `extendRemixOffer` |
| `src/types/remix-offers.ts` | `RemixOffer`, `RemixOfferListResponse`, `PublicRemix` types; `OPEN_LICENSES` constant |
| `src/app/create/remix/[contract]/[tokenId]/page.tsx` | Full remix creation page. Owner path: IPFS upload → branch on `collection.standard` (ERC-1155 uses `mint_item` direct call; ERC-721 uses `createMintIntent`) → optional listing → `confirmSelfRemix`. Non-owner path: `submitRemixOffer`. Collection key = `collectionId ?? contractAddress`. |
| `src/components/portfolio/approve-mint-sheet.tsx` | Creator approval flow for incoming remix offers. Mints remix into selected collection (ERC-1155 or ERC-721), creates listing for buyer, polls for orderHash, calls `confirmRemixOffer`. |
| `src/components/asset/remixes-tab.tsx` | Read-only: displays public remixes of a token + parent attribution banner |
| `src/components/chipi/wallet-setup-dialog.tsx` | First-time wallet PIN creation |
| `src/components/chipi/session-setup-dialog.tsx` | SNIP-9 session key registration |
| `src/components/chipi/pin-dialog.tsx` | Generic PIN entry dialog |
| `src/components/chipi/tx-status.tsx` | Transaction status display |

---

## Security Notes (as of 2026-05-06 audit)

### ChipiPay Session Key Architecture (tracked — awaiting upstream fix)

**Finding 3 (HIGH):** `signTypedData()` in `use-session-key.ts` decrypts the owner's Starknet private key into a plain JS string on the V8 heap. Any co-resident code (browser extension, XSS payload, malicious npm dependency) with access to the JS execution context can extract it. This is a structural constraint of ChipiPay's client-side AES decryption model.
- **Mitigation we own:** Ensure no XSS entry points are introduced (no `dangerouslySetInnerHTML` with user content, audit new npm deps carefully).
- **Full fix requires:** ChipiPay providing a signing API that never returns decrypted key material to the caller. Escalated.

**Finding 4 (HIGH):** `SessionKeyData` (stored in `user.unsafeMetadata.chipiSession`) contains `encryptedPrivateKey`. Per Clerk docs, `unsafeMetadata` is client-writable and embedded in the session JWT. An attacker with a valid session token can read the encrypted session private key and attempt to brute-force the PIN.
- **Mitigation we own:** Encourage passkey adoption (longer effective key); consider enforcing minimum 8-digit PINs.
- **Full fix requires:** Moving session storage to `privateMetadata` (server-only). Requires ChipiPay SDK changes. Escalated.

**Finding 14 (MEDIUM):** `approve` and `set_approval_for_all` were removed from the session key whitelist (2026-05-06). If marketplace listings break in production, these must be re-added and ChipiPay must be asked to enforce per-contract restrictions (not just per-selector). See `use-session-key.ts` comment for details.

### NEXT_PUBLIC_MEDIALANE_API_KEY (accepted risk — read-only)

`NEXT_PUBLIC_MEDIALANE_API_KEY` is intentionally public — it authorizes **read-only** operations on the Medialane backend API and is baked into the client bundle so SWR hooks in browser context can fetch marketplace/portfolio data directly. The backend must enforce that this key cannot create, update, or delete any data. If read endpoints ever expose sensitive PII, or if the key is granted write access, all client-side SDK calls must be proxied through server-side Next.js API routes using the server-only `MEDIALANE_API_KEY` variable (no `NEXT_PUBLIC_` prefix) — following the existing pattern in `api-server.ts`.
