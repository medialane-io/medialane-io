# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# bun is not in PATH by default — use the full path
/Users/kalamaha/.nvm/versions/node/v24.15.0/bin/bun dev          # Start dev server (Next.js 15, port 3000)
/Users/kalamaha/.nvm/versions/node/v24.15.0/bin/bun run build    # Production build (must pass clean before deploy)
/Users/kalamaha/.nvm/versions/node/v24.15.0/bin/bun start        # Start production server
/Users/kalamaha/.nvm/versions/node/v24.15.0/bin/bun lint         # Run ESLint

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
- **@medialane/sdk** — Published npm package (`@medialane/sdk@0.24.1`, org: `@medialane`). 0.24.0 added `ApiCollection.isHidden`/`isFeatured` + `ApiCreatorProfile.collectionImage`; 0.24.1 fixed the `NFTCOMMENTS_CONTRACT_MAINNET` default (previous `0x024f97…` was undeployed and caused the 2026-05-17 comments outage). Provides API types (`ApiOrder`, `ApiToken`, `ApiCollection`, `ApiOrderTokenMeta`, `ApiComment`, `OrderStatus`, `IpAttribute`, `IpNftMetadata`, `SupportedTokenSymbol`), contract ABIs (`IPMarketplaceABI`, `IPNftABI`, etc. — split per-ABI under `abis/` since v0.19.0), service registry (`getService`, `listServices`, `ServiceId` literal union since v0.20.0), token catalogue (`SUPPORTED_TOKENS`, `getTokenByAddress`, `getListableTokens`), SNIP-12 signing helpers (`buildOrderTypedData`, `build1155OrderTypedData`, etc. — unified into one module since v0.18.0), and the `Medialane1155Module` for ERC-1155 marketplace ops. Address normalization happens inside `ApiClient`. `OrderStatus` dropped `"COUNTER_OFFERED"` in 0.23.0 — use `ApiOrder.hasActiveCounterOffer` instead. `ApiCollection.standard: "ERC721" | "ERC1155" | "UNKNOWN"` — runtime value is never "UNKNOWN" after the 2026-05-22 backend migration; the SDK type union will narrow in a future release. `ApiCollection.service: string` (non-nullable, registered via the SDK service registry).
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
6. Server state (tokens, collections, orders) fetched via SWR hooks in `src/hooks/` — **all** data comes from the backend API, no direct RPC calls in normal flows

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

The mint landing pages are the platform's paid-traffic acquisition surface. They follow a **conversion-focused trim** (shipped 2026-05-28): hero only above the fold (badge-free, short headline, trust strip, embedded sign-up, sticky image), four detail sections collapsed behind a single `<details>` "Saiba mais" / "Learn more" disclosure, no duplicate bottom CTA. Both pages share the same shape — diverge only on copy and contract addresses.

### Brazil Campaign (`/br/mint`)
Portuguese language. Files: `src/app/br/mint/br-mint-content.tsx` + `src/app/br/mint/page.tsx` + `src/app/br/mint/genesis-mint.tsx`.
Storage key: `ml_br_mint_${userId}`. Contract: `BR_MINT_CONTRACT`.
```
NEXT_PUBLIC_BR_MINT_CONTRACT=0x...
NEXT_PUBLIC_BR_NFT_URI=ipfs://...
NEXT_PUBLIC_BR_NFT_IMAGE_URL=     # optional direct image URL
```

### Global English Campaign (`/mint`)
English language, worldwide. Files: `src/app/mint/mint-content.tsx` + `src/app/mint/page.tsx` + the shared `src/components/airdrop/genesis-mint.tsx`.
Storage key: `ml_mint_${userId}`. Contract: `MINT_CONTRACT`.
```
NEXT_PUBLIC_MINT_CONTRACT=0x...
NEXT_PUBLIC_MINT_NFT_URI=ipfs://...
NEXT_PUBLIC_MINT_NFT_IMAGE_URL=   # optional direct image URL
```

### Mint flow (both campaigns, shipped 2026-05-28)

1. **Unauthenticated:** the page embeds Clerk's `<SignUp routing="hash" forceRedirectUrl="…" />` inline in the hero — no modal interrupt. Sign-up form theming follows the resolved app theme via `@clerk/themes` `dark` preset + `useTheme().resolvedTheme` (`src/app/br/mint/genesis-mint.tsx`, `src/components/airdrop/genesis-mint.tsx`).
2. **Signed in, no wallet:** single CTA ("Garantir meu lugar" / "Claim my spot") opens `WalletSetupChoiceDialog` (`src/components/chipi/wallet-setup-choice-dialog.tsx`, takes `locale: "en" | "pt"`). Passkey-first if `usePasskeyStatus().status.isSupported`, with a small "Criar PIN" / "Create PIN" fallback link.
3. **Wallet created:** dialog auto-advances to the inline `mintStep === "enter-pin"` step. Auth method defaults to `pin`, switches to `passkey` if `usePasskeyStatus().status.hasPasskey` (local credential exists). Decryption failures detected via `looksLikeEncryptionFailure(msg)` surface a "looks like your account uses [other method]" recovery hint with a one-click switch.
4. **Confirm:** `executeTransaction` calls `mint_item(recipient, ByteArray(tokenURI))` → success / error.

When `MINT_CONTRACT` / `BR_MINT_CONTRACT` or the corresponding URI is empty, the CTA renders disabled ("Distribuição não iniciada" / "Airdrop not started yet").

### Clerk localization (`/br/*` routes only)

The root `<ClerkProvider>` in `src/app/layout.tsx` reads an `x-pathname` request header set by `src/middleware.ts` (via `NextResponse.next({ request: { headers } })`), and conditionally passes `localization={ptBR}` from `@clerk/localizations` when the path starts with `/br`. `<html lang>` is set accordingly. Nesting a second `<ClerkProvider>` in a child layout does **not** work — Clerk only respects the outermost provider. The previous nested provider at `src/app/br/layout.tsx` was deleted 2026-05-28 because it was dead code.

## Key File Locations

- Contract addresses & RPC URL: `src/lib/constants.ts`
- Shared TypeScript types: `src/types/index.ts` + `@medialane/sdk`
- Global CSS variables (HSL theme tokens): `src/app/globals.css`
- App shell (nav canvas, theme, toast): `src/app/providers.tsx`
- Navigation command definitions: `src/lib/nav-commands.ts`

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

**Stale order sync**: after every write op, `setTimeout(() => invalidate(), 10000)` fires a delayed revalidation to ensure UI reflects on-chain state after the indexer processes the block (~6s poll cycle). SWR hooks poll at `refreshInterval: 60_000`. `mutate()` covers the writing user's own actions; polling covers cross-user updates and indexer lag.

### Wallet & session (`use-session-key.ts`)
- `walletAddress` — user's Starknet address (from ChipiPay)
- `hasWallet` / `hasActiveSession` — gate wallet setup/session dialogs
- `setupSession(pin)` — creates SNIP-9 session key on-chain (6-hour validity)
- `signTypedData(typedData, pin)` — signs with session key or owner key

### Transaction execution — ATOMIC (changed 2026-05-20)

`useChipiTransaction.executeTransaction` (`src/hooks/use-chipi-transaction.ts`)
is the **single chokepoint** for every io write (fulfill, listing, offer,
cancel, mint, drop claim). It executes via ChipiPay's `TxBuilder.sendSponsored()`
(`@chipi-stack/core` + `ChipiPaymasterAdapter` from `useChipiContext().chipiSDK`)
— **atomic and gasless**: one call reverting reverts the whole transaction.

**Do not go back to `callAnyContract`.** ChipiPay's hosted `callAnyContract`
relayer executes batches **non-atomically** — a reverted call is swallowed and
sibling calls are not rolled back. That caused the creators-fund fee to be
charged on failed buys (tx `0x61c84020…`). Spec:
`medialane-core/docs/specs/2026-05-20-io-atomic-execution-design.md`.

- The key is decrypted client-side via `decryptPrivateKey` (`@chipi-stack/backend`)
  → `new Account(provider, address, key, "1")`. **Pass `cairoVersion "1"` explicitly** —
  it skips starknet.js's `getClassHashAt` detection RPC.
- `starknetProvider` (`src/lib/starknet.ts`) is configured `blockIdentifier: "latest"` —
  the RPC rejects the default `"pending"` block tag (`-32602: Invalid block id`).

### Marketplace cache invalidation (fixed 2026-05-20)

`useMarketplace`'s `invalidate()` uses `mutate(filter)` — revalidate **without**
clearing cached data. Do **not** pass `undefined` as mutate's data arg: it wipes
the token cache, which unmounts the asset page's variant component mid-purchase
and destroys the open success dialog.

---

## Known Bugs

No outstanding known bugs as of 2026-05-12.

## Backlog

- [ ] Price range filter in marketplace (requires backend min/max params — deferred)

---

## App Shell Architecture

The app uses a **full-width canvas layout** — no sidebar. Navigation is handled by `NavCommandMenu` from `@medialane/ui`.

```
layout.tsx (server)
  └─ ClerkProvider > ChipiProvider
       └─ Providers (client) — src/app/providers.tsx
            └─ ThemeProvider > TooltipProvider > SWRConfig (global onError → sonner toast)
                 └─ Shell (route-aware: MainShell | StandaloneShell)
                      MainShell:
                        ├─ ChipiSessionUnlockProvider
                        ├─ NavCommandMenu (aurora canvas + cmdk palette, z-99–101)
                        ├─ NavTrigger (absolute top-3 left-4 sm:left-6 lg:left-8)
                        │    Medialane icon (h-8) + Menu icon → opens NavCommandMenu
                        ├─ <main> — full-width page content
                        └─ <footer> — links + logo
                      StandaloneShell: plain flex-col (used for /br/*, /mint, /airdrop)
            Toaster (outside Shell)
```

**Key rules:**
- There is **no sidebar** — do not add `SidebarProvider` or `AppSidebar`.
- All navigation is via `NavCommandMenu`. Add new routes to `src/lib/nav-commands.ts`.
- `NavCommandMenu` is mounted once in `MainShell`. Any button anywhere can call `useNavCommandMenu().open()` to open it. `⌘K` also works.
- Nav canvas uses aurora blob CSS classes from `@medialane/ui/styles` (`nav-canvas-aurora`, `nav-canvas-overlay`, `aurora-purple/blue/rose/orange`).
- `NavTrigger` left offset uses `left-4 sm:left-6 lg:left-8` to align with page content padding (`px-4 sm:px-6 lg:px-8`).
- Marketplace filters are an inline horizontal toolbar — Sort/Type/Currency chips.

---

## Key File Locations (complete)

| Path | Purpose |
|---|---|
| `src/lib/constants.ts` | All env vars + contract addresses |
| `src/lib/medialane-client.ts` | SDK singleton (MedialaneClient) — explicitly sets `marketplaceContract`, `marketplace1155Contract`, `collectionContract`, `collection1155Contract` |
| `src/lib/cairo-calldata.ts` | Cairo calldata helpers: `serializeByteArray(str)` → `string[]` for Cairo ByteArray (UTF-8 safe, supports any Unicode); `encodeU256(n: bigint)` → `[low, high]`. Use these instead of manual felt encoding anywhere mint/transfer calldata is built. Never use starknet.js `byteArrayFromString` directly — it is ASCII-only. |
| `src/components/airdrop/genesis-mint.tsx` | Shared airdrop components: `GenesisMint` (full claim flow — sign-in gate, wallet setup, PIN, mint, success/error), `AirdropEventCard` (genesis NFT image with fallback). Used by `/mint` and `/airdrop`. |
| `src/lib/utils.ts` | `ipfsToHttp`, `timeUntil`, `formatPrice`, `cn` |
| `src/types/index.ts` | Local TypeScript types |
| `src/types/ip.ts` | IP/licensing constants: `LICENSE_TYPES`, `IP_TYPES`, `GEOGRAPHIC_SCOPES`, `AI_POLICIES`, `DERIVATIVES_OPTIONS`, `LICENSE_TRAIT_TYPES` |
| `src/app/api/pinata/route.ts` | Universal digital asset upload (Clerk-gated, direct Pinata) — accepts image + full licensing schema + `creator` wallet + `external_url`, returns `{ uri, imageUri, cid }`. Embeds creator as attribute. |
| `src/app/api/pinata/image/route.ts` | Image-only upload (Clerk-gated, direct Pinata) — returns `{ imageUri: "ipfs://...", cid }`. Used by create collection flow |
| `src/app/api/pinata/json/route.ts` | Generic JSON document upload (Clerk-gated, direct Pinata) — returns `{ uri: "ipfs://...", cid }`. Used by create collection flow to anchor collection metadata on-chain as `baseUri` |
| `src/app/portfolio/layout.tsx` | Portfolio shared layout: auth guard, wallet display, subnav with 6 links + unread badge |
| `src/hooks/use-collections.ts` | `useCollections`, `useCollection`, `useCollectionTokens`, `useCollectionsByOwner` |
| `src/app/globals.css` | HSL theme tokens, `.glass`, `.gradient-text` |
| `src/app/providers.tsx` | Global shell: NavCommandMenu + NavTrigger + ChipiSessionUnlockProvider + footer |
| `src/lib/nav-commands.ts` | `NAV_COMMANDS: NavCommandGroup[]` — all 39 nav canvas entries across 5 groups (Navigate, Create & Mint, Portfolio, Explore by type, Documentation) |
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
| `src/components/marketplace/marketplace-dialog-primitives.tsx` | Shared marketplace dialog building blocks: `MarketplaceSuccessState`, `MarketplaceActivatingSession`, `MarketplaceSignInGate`, `MarketplaceDialogHero`, `MarketplacePinStep`, `MarketplaceTxLink`, `MarketplaceProcessingState`, `CurrencyPicker`, `DurationPicker` |
| `src/components/marketplace/purchase-dialog.tsx` | Buy/fulfill flow |
| `src/components/marketplace/listing-dialog.tsx` | Create listing flow — uses `marketplace-dialog-primitives`. (`MarketplaceDebugPanel` + snapshot machinery was removed entirely in PR #39, 2026-05-25.) |
| `src/components/marketplace/offer-dialog.tsx` | Make offer flow — includes quantity field for ERC-1155 |
| `src/hooks/use-marketplace-action-flow.ts` | Shared PIN/passkey/session activation state machine for marketplace dialogs. Handles wallet-setup gate, session refresh (with amount-cap clear), PIN entry, passkey auth, and action execution. Used by listing-dialog and offer-dialog. |
| `src/hooks/use-remix-offers.ts` | SWR hooks + mutation helpers for remix offer lifecycle: `useRemixOffers`, `useTokenRemixes`, `submitRemixOffer`, `submitAutoRemixOffer`, `confirmSelfRemix`, `confirmRemixOffer`, `rejectRemixOffer`, `extendRemixOffer` |
| `src/types/remix-offers.ts` | `RemixOffer`, `RemixOfferListResponse`, `PublicRemix` types; `OPEN_LICENSES` constant |
| `src/app/create/remix/[contract]/[tokenId]/page.tsx` | Full remix creation page. Owner path: IPFS upload → branch on `collection.standard` (ERC-1155 uses `mint_item` direct call; ERC-721 uses `createMintIntent`) → optional listing → `confirmSelfRemix`. Non-owner path: `submitRemixOffer`. Collection key = `collectionId ?? contractAddress`. |
| `src/components/portfolio/approve-mint-sheet.tsx` | Creator approval flow for incoming remix offers. Mints remix into selected collection (ERC-1155 or ERC-721), creates listing for buyer, polls for orderHash, calls `confirmRemixOffer`. |
| `src/components/asset/remixes-tab.tsx` | Read-only: displays public remixes of a token + parent attribution banner |
| `src/components/chipi/wallet-setup-dialog.tsx` | First-time wallet PIN creation (legacy, PIN-only — used by launchpad flows) |
| `src/components/chipi/wallet-setup-choice-dialog.tsx` | First-time wallet setup with passkey-first + PIN fallback, `locale: "en" \| "pt"` (used by `/br/mint`, `/mint`, `/airdrop`) |
| `src/lib/chipi/looks-like-encryption-failure.ts` | Heuristic for "wrong PIN/passkey" decryption errors — used to surface "switch to other method" hints when a mint or transfer fails on the chosen auth |
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

### Session-key whitelist is a contract surface (2026-05-26 lesson)

The `allowedEntrypoints` list in `src/hooks/use-session-key.ts` must include every Cairo selector the io app ever invokes via the session-key-signed pipeline (`useChipiTransaction.executeTransaction`). Missing a selector → ChipiPay paymaster simulation reverts with `TRANSACTION_EXECUTION_ERROR` → user sees a paymaster error with no actionable detail.

Two long-standing silent failures were caught + fixed this way:

- **`safe_transfer_from`** (PR #45) — ERC-1155 transfers were broken for every user since the whitelist was first defined.
- **`deploy_collection`** (PR #53) — `/launchpad/nfteditions/create` was broken since ERC-1155 collection deploys shipped.

**Audit methodology:**

```bash
# 1. Every entrypoint actually called in this app
grep -rEo 'entrypoint:\s*"[a-zA-Z_]+"' src/ --include='*.ts' --include='*.tsx' | awk -F'"' '{print $2}' | sort -u

# 2. Diff against the whitelist in use-session-key.ts; any selector
#    called but not whitelisted is a silent-failure bug.
```

Run this any time a new contract integration ships, before merging.

**Existing-session caveat:** when the whitelist is expanded, users with sessions created BEFORE the deploy still have the old selector set registered on-chain. They must reset via Settings → Wallet (toggle "Remember session" off then back on) to pick up the new set. The friendly error from PR #50 in `use-chipi-transaction.ts` surfaces this clearly.

### Medialane API key — server-only via BFF proxy (2026-05-24)

`NEXT_PUBLIC_MEDIALANE_API_KEY` is **gone**. The backend has no read-only key scope, so the previous "accepted risk" framing was aspirational — the key shipped in the browser bundle was a fully-privileged tenant key.

Current architecture:

- **Vercel env var:** only `MEDIALANE_API_KEY` (no `NEXT_PUBLIC_` prefix) — server-side scope.
- **BFF proxy:** `src/app/api/proxy/v1/[...path]/route.ts` injects the key into outbound requests. The browser never sees it.
- **`constants.ts`:** both `MEDIALANE_BACKEND_URL` and `MEDIALANE_API_KEY` exports are **environment-aware**:
  - server-side: real backend URL + real key
  - browser: `/api/proxy` + empty string
- **SDK client (`medialane-client.ts`):** picks the right backendUrl per environment automatically.
- **Direct client fetches** (`use-remix-offers.ts`, launchpad pages, etc.) that already call `${MEDIALANE_BACKEND_URL}/v1/...` work unchanged — they route through `/api/proxy` in the browser.

**Pattern for new client code:** just use `MEDIALANE_BACKEND_URL` from `@/lib/constants` and don't worry about the key. If you need the user's Clerk JWT for identity routes, pass it through `Authorization: Bearer <token>` — the proxy forwards it unchanged.

**Pattern for new server code (RSC, BFF route, sitemap, etc.):** read `process.env.MEDIALANE_API_KEY` directly. `api-server.ts` is the canonical example.
