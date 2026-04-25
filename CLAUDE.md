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
- **@medialane/sdk** — Published npm package (`@medialane/sdk@0.7.1`, org: `@medialane`). Provides `ApiOrder`, `ApiToken`, `ApiCollection`, `ApiOrderTokenMeta`, `ApiComment`, `OrderStatus`, `IpAttribute`, `IpNftMetadata`, `SupportedTokenSymbol` types and the SDK client used in `src/lib/medialane-client.ts`. `ApiOrder.token: ApiOrderTokenMeta | null` carries name/image/description enrichment from the backend — no per-row `useToken` calls needed. `ApiCollection.collectionId: string | null` is the on-chain registry numeric ID needed for `createMintIntent`. The SDK normalizes all addresses internally. `getListableTokens()` returns all tokens with `listable: true` (USDC, USDT, ETH, STRK, WBTC) — used by `listing-dialog` and `offer-dialog` to build currency lists. `SupportedCurrencySymbol` local type was removed in v0.4.2; use `SupportedTokenSymbol` from `@medialane/sdk` instead. `getTokenComments(contract, tokenId, opts?)` added in v0.4.8. `ApiCollection.standard: "ERC721" | "ERC1155" | "UNKNOWN"` added in v0.6.5. `Medialane1155Module` (`client.marketplace1155`) for ERC-1155 on-chain ops added in v0.6.8. `CreateListingIntentParams.amount?: string` for ERC-1155 multi-unit listings added in v0.6.9.
- **Pinata** — IPFS uploads via Next.js routes (all Clerk-gated, direct to Pinata):
  - `src/app/api/pinata/route.ts` — Universal IP asset upload. Accepts `file`, `name`, `description`, `external_url`, `creator` (wallet address), and full licensing schema (`ipType`, `licenseType`, `commercialUse`, `derivatives`, `attribution`, `geographicScope`, `aiPolicy`, `royalty`, `edition`). Uploads image then metadata JSON. Returns `{ uri, imageUri, cid }`. Metadata follows OpenSea ERC-721 standard with `attributes` array. Creator wallet embedded as `{ trait_type: "Creator", value: walletAddress }`.
  - `src/app/api/pinata/image/route.ts` — Image-only upload. Returns `{ imageUri: "ipfs://...", cid }`. Used by the create collection flow for the preview image.
  - `src/app/api/pinata/json/route.ts` — Generic JSON document upload. Accepts any JSON body. Returns `{ uri: "ipfs://...", cid }`. Used by the create collection flow to upload collection metadata JSON (`{ name, description, image, external_link }`) and set the resulting URI as `baseUri` for the on-chain collection.
  - `src/app/api/pinata/genesis/route.ts` — Genesis mint specific.

### Data Flow

1. User authenticates via Clerk → ChipiPay derives a Starknet wallet from the session
2. Session keys (SNIP-9) are stored in Clerk user metadata, managed via `use-session-key.ts`
3. **Wallet address**: always read from `useSessionKey().walletAddress` — never from `user.publicMetadata.publicKey` (Clerk server-only, returns `undefined` on the client)
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

**Stale order sync**: after every write op, `setTimeout(() => invalidate(), 10000)` fires a delayed revalidation to ensure UI reflects on-chain state after the indexer processes the block (~6s poll cycle). SWR hooks also have `refreshInterval: 30000` / `20000`.

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

## Known Bugs (as of 2026-03-20)

All previously noted bugs were fixed. No outstanding known bugs.

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
- [x] `@medialane/sdk` published to npm — replaced local `file:` dep ✓ 2026-03-06 (latest: v0.7.1)
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
| `src/lib/medialane-client.ts` | SDK singleton (MedialaneClient) |
| `src/lib/utils.ts` | `ipfsToHttp`, `timeUntil`, `formatPrice`, `cn` |
| `src/types/index.ts` | Local TypeScript types (CartItem, etc.) |
| `src/types/ip.ts` | IP/licensing constants: `LICENSE_TYPES`, `IP_TYPES`, `GEOGRAPHIC_SCOPES`, `AI_POLICIES`, `DERIVATIVES_OPTIONS`, `LICENSE_TRAIT_TYPES` |
| `src/app/api/pinata/route.ts` | Universal IP asset upload (Clerk-gated, direct Pinata) — accepts image + full licensing schema + `creator` wallet + `external_url`, returns `{ uri, imageUri, cid }`. Embeds creator as attribute. |
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
| `src/components/asset/comments-section.tsx` | Messenger-style chat bubble panel (480px fixed height). Own comments right-aligned, others left with gradient avatar. Per-comment Voyager link. Enhanced compose bar with "Post on-chain" CTA. |
| `src/app/api/reports/route.ts` | Reports proxy to backend — handles `COMMENT` type, builds `COMMENT::<commentId>` targetKey |
| `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx` | Dispatcher: `detectAssetType(source, standard)` → routes to pop/drop/edition/standard |
| `src/app/asset/[contract]/[tokenId]/asset-page-pop.tsx` | POP Protocol view — soulbound credential, emerald theme, claim-only |
| `src/app/asset/[contract]/[tokenId]/asset-page-drop.tsx` | Collection Drop view — drop info panel (supply, window, price), secondary market |
| `src/app/asset/[contract]/[tokenId]/asset-page-edition.tsx` | NFT Edition ERC-1155 view — edition stats, holders grid, full marketplace |
| `src/app/asset/[contract]/[tokenId]/asset-page-standard.tsx` | Standard ERC-721 view — IP + license + remix + marketplace tabs |
| `src/app/asset/[contract]/[tokenId]/use-order-actions.ts` | Shared cancel/accept order state machine; optional `tokenStandard` param for ERC-1155 |
| `src/app/asset/[contract]/[tokenId]/cancel-listing-dialog.tsx` | Shared cancel status dialog (processing/success/error) |
| `src/hooks/use-session-key.ts` | Wallet derivation + SNIP-9 session key |
| `src/hooks/use-marketplace.ts` | All marketplace write operations |
| `src/hooks/use-chipi-transaction.ts` | ChipiPay tx execution + status |
| `src/hooks/use-cart.ts` | Zustand cart store |
| `src/components/marketplace/purchase-dialog.tsx` | Buy/fulfill flow |
| `src/components/marketplace/listing-dialog.tsx` | Create listing flow |
| `src/components/marketplace/offer-dialog.tsx` | Make offer flow |
| `src/components/chipi/wallet-setup-dialog.tsx` | First-time wallet PIN creation |
| `src/components/chipi/session-setup-dialog.tsx` | SNIP-9 session key registration |
| `src/components/chipi/pin-dialog.tsx` | Generic PIN entry dialog |
| `src/components/chipi/tx-status.tsx` | Transaction status display |
