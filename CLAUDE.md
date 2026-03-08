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
- **@medialane/sdk** — Published npm package (`@medialane/sdk@0.2.8`, org: `@medialane`). Provides `ApiOrder`, `ApiToken`, `ApiCollection`, `ApiOrderTokenMeta`, `OrderStatus`, `IpAttribute`, `IpNftMetadata` types and the SDK client used in `src/lib/medialane-client.ts`. `ApiOrder.token: ApiOrderTokenMeta | null` carries name/image/description enrichment from the backend — no per-row `useToken` calls needed.
- **Pinata** — IPFS uploads via two Next.js routes (both Clerk-gated, direct to Pinata):
  - `src/app/api/pinata/route.ts` — Universal IP asset upload. Accepts full licensing schema, uploads image + metadata JSON in one call. Returns `{ uri, imageUri, cid }`.
  - `src/app/api/pinata/image/route.ts` — Image-only upload. Returns `{ imageUri: "ipfs://...", cid }`. Used by the create collection flow.
  - `src/app/api/pinata/genesis/route.ts` — Genesis mint specific.

### Data Flow

1. User authenticates via Clerk → ChipiPay derives a Starknet wallet from the session
2. Session keys (SNIP-9) are stored in Clerk user metadata, managed via `use-session-key.ts`
3. **Asset uploads**: `POST /api/pinata` → image to Pinata → metadata JSON to Pinata → `ipfs://` URI → mint tx. Never goes through the backend. `PINATA_JWT` is consumed server-side in the Next.js route.
4. Marketplace orders use SNIP-12 typed data signing (see `use-marketplace.ts`)
5. Cart state is persisted to localStorage via Zustand (`use-cart.ts`)
6. Server state (tokens, collections, orders) fetched via TanStack Query hooks in `src/hooks/`

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
| `useCollections()` | All collections | `GET /v1/collections` |
| `useCollection(contract)` | Single collection | `GET /v1/collections/:contract` |
| `useCollectionTokens(contract)` | Tokens in collection | `GET /v1/collections/:contract/tokens` |
| `useCollectionsByOwner(address)` | Collections owned by address (DB-based) | `GET /v1/collections?owner=address` (direct fetch, bypasses SDK) |
| `useUserCollections(address)` | Collections owned by address (on-chain direct) | Calls `list_user_collections()` + `get_collection()` on registry contract via starknet.js. Used in portfolio/collections — bypasses DB entirely so new collections appear immediately |
| `useActivities(query)` | Global activity feed | `GET /v1/activities` |
| `useActivitiesByAddress(address)` | User activity | `GET /v1/activities/:address` |

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

## Known Bugs (as of 2026-03-06)

All previously noted bugs were fixed. No outstanding known bugs.

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
- [x] Portfolio collections page: shows user-owned collections via `useUserCollections` (on-chain direct, not DB-based) ✓ 2026-03-08
- [x] Create asset page: collection selector using `useUserCollections`; correct mint flow via `createMintIntent` with `collectionId` ✓ 2026-03-08
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
- [x] `@medialane/sdk` published to npm — replaced local `file:` dep ✓ 2026-03-06 (latest: v0.2.8)
- [x] batchTokenMeta: order endpoints return `token.{name,image,description}` — eliminates N+1 `useToken` calls ✓ 2026-03-07
- [x] Stale order sync: refreshInterval + delayed invalidate after write ops ✓ 2026-03-07
- [x] Collection image upload in create flow (`/api/pinata/image`) + image stored in intent typedData ✓ 2026-03-07
- [x] Full programmable licensing metadata (Berne Convention, CC variants, AI policy, royalty) ✓ 2026-03-06
- [x] Asset page License tab — rich display from IPFS attributes (Berne badge, icon table) ✓ 2026-03-06
- [x] Asset upload decentralised — direct Pinata via `/api/pinata`, no backend hop ✓ 2026-03-06

---

## App Shell Architecture (as of 2026-03-06)

The app uses a **shadcn `sidebar-07` layout** as the global shell — no top `Header` component exists.

```
layout.tsx (server)
  └─ ClerkProvider > ChipiProvider
       └─ Providers (client) — src/app/providers.tsx
            └─ ThemeProvider > SidebarProvider
                 ├─ AppSidebar — src/components/layout/app-sidebar.tsx
                 │    Brand logo + Platform nav (Marketplace/Collections/Portfolio/Create/Launchpad/Activity)
                 │    + Clerk user (UserButton + name/email) in SidebarFooter
                 │    collapsible="icon" — collapses to icons on desktop, Sheet on mobile
                 └─ SidebarInset
                      ├─ sticky h-12 top bar: SidebarTrigger + search + theme + cart + auth
                      ├─ SessionExpiryBanner (sticky top-12)
                      └─ <main> — page content
            (outside SidebarInset) CartDrawer + Toaster
```

**Key rules:**
- Never nest `SidebarProvider` inside a page — it's global in `providers.tsx`
- `UserButton` from Clerk must NOT be wrapped in `SidebarMenuButton` (button-in-button → React error #130)
- `SessionExpiryBanner` uses `sticky top-12` (header is h-12 = 48px, was top-16 when header was h-16)
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
| `src/app/api/pinata/route.ts` | Universal IP asset upload (Clerk-gated, direct Pinata) — accepts image + full licensing schema, returns `{ uri, imageUri, cid }` |
| `src/app/api/pinata/image/route.ts` | Image-only upload (Clerk-gated, direct Pinata) — returns `{ imageUri: "ipfs://...", cid }`. Used by create collection flow |
| `src/app/portfolio/layout.tsx` | Portfolio shared layout: auth guard, wallet display, subnav with 6 links + unread badge |
| `src/hooks/use-collections.ts` | `useCollections`, `useCollection`, `useCollectionTokens`, `useCollectionsByOwner` |
| `src/hooks/use-user-collections.ts` | `useUserCollections(address)` — on-chain direct via starknet.js; returns `{ onChainId, contractAddress, name, symbol }[]`. Used by portfolio/collections and create/asset collection selector |
| `src/app/globals.css` | HSL theme tokens, `.glass`, `.gradient-text` |
| `src/app/providers.tsx` | Global shell: SidebarProvider + AppSidebar + SidebarInset + top bar |
| `src/components/layout/app-sidebar.tsx` | Shadcn sidebar: brand, nav, Clerk user footer |
| `src/middleware.ts` | Clerk route protection (/portfolio, /create/*) |
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
