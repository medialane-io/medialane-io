<img width="1260" height="640" alt="Medialane: Programmable IP on Starknet" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# Medialane

**Creator Launchpad + NFT Marketplace for Programmable IP on Starknet**

Medialane is a consumer-grade Web3 application that lets creators mint, license, and trade intellectual property as NFTs, with a self-custody wallet secured by your device passkey and immutable licensing embedded directly in IPFS metadata. Built on [Starknet](https://starknet.io) with ZK-powered scalability.

Live at [medialane.io](https://medialane.io)

---

## What is Medialane?

Medialane is a platform for the **creative economy on Starknet**. It bridges Web2 simplicity with Web3 ownership:

- **Creators** mint their work (art, music, video, documents, code, patents) as IP NFTs with programmable licensing terms embedded immutably in IPFS metadata
- **Collectors** browse, buy, and make offers on digital assets in a full-featured NFT marketplace
- **Licensing** is Berne Convention-compliant: commercial use, derivative rights, attribution, territory, AI policy, and royalty are all encoded as OpenSea-compatible ERC-721 attributes
- **Self-custody, passkey-secured**: a Starknet wallet (MediaWallet) is created on first use, sealed by your device passkey (Face ID / Touch ID / Windows Hello)

---

## Features

### Discover
- Full-width hero with kinetic headline, CTA buttons, live platform stats, and scrolling asset strip
- Featured collections bento grid with verified badges and floor prices
- Recent listings + onchain activity feed side by side

### Coins
- Discover creator coins and memecoins (`/coins`) with live Ekubo prices and on-chain supply
- Read-only coin pages, with trading handled on the per-chain app (Starknet); io links out to it
- Launch a Creator Coin or claim a memecoin from the launchpad

### Creator Launchpad
- Mint digital assets across 12 canonical IP types: Audio, Art, Video, Photography, NFT, Patents, Posts, Publications, Documents, RWA, Software, Custom
- Dynamic template fields per IP type, with a collapsed optional panel and smart defaults per category
- Full programmable licensing form: CC variants, commercial use, derivatives, attribution, territory, AI policy, royalty %
- Licensing metadata embedded in IPFS as ERC-721 attributes (OpenSea-compatible and Berne Convention compliant)
- Media tab on asset pages with embedded players for YouTube, Spotify, SoundCloud, TikTok
- Creator wallet address embedded in every asset as `{ trait_type: "Creator", value: walletAddress }`
- Uploads pinned to IPFS through medialane-backend's metered Pinata path, billed to the app's own tenant key
- Create and deploy ERC-721 collections on Starknet
- Collection metadata JSON uploaded to IPFS at creation time, with `baseUri` set onchain so any dApp can resolve collection images permissionlessly
- **NFT Editions** (`/launchpad/nfteditions`): mint multi-edition ERC-1155 tokens into your IP Collection 1155 contracts, each with its own artwork, supply, and on-chain provenance
- **IP Tickets** (`/launchpad/tickets`): deploy a ticket collection and sell redeemable, tradeable ERC-721 tickets for events and access
- **IP Club** (`/launchpad/club`): run a membership club backed by a transferable ERC-1155 membership card, with a validity window that gates membership
- **IP Sponsorship** (`/launchpad/sponsorship`): sell a sponsorship license on an asset you own; sponsors bid, you accept, and settlement is direct between the two parties

### NFT Marketplace
- Browse, search, and filter all Medialane digital assets
- Buy NFTs directly or make offers with USDC, USDT, ETH, STRK, or WBTC
- **Cart dialog**: centered modal with blurred atmospheric backdrop, item thumbnails, individual Buy buttons, and "Buy all N items" batch checkout with a single passkey confirmation
- Accept, cancel, and manage listings and offers from the portfolio
- **Service-specific asset pages**, each asset type getting a tailored experience:
  - **POP Protocol**: soulbound credential view, claim-only
  - **Collection Drop**: drop context panel (supply progress bar, mint window, price), secondary market
  - **NFT Edition (ERC-1155)**: multi-edition stats (total minted, unique owners), holders grid, full marketplace
  - **Standard (ERC-721)**: full IP detail with license, remix, and marketplace tabs
- Asset pages with Details, License, Listings, Offers, and History tabs
- Dynamic color theming derived from the asset image (CSS custom properties, WCAG contrast-checked)
- Atmospheric blurred background on asset pages and all action dialogs for immersive browsing
- Marketplace filters: currency, price range (min/max), order type (listings/offers)

### Asset Cards (unified `TokenCard` component)
- Single modular `TokenCard` used consistently across collection pages, creator carousels, portfolio, search, and account pages
- Action row with solid brand-colored buttons matching the asset page style (`rounded-[11px]`, `hover:brightness-110`):
  - **Listed (non-owner)**: Buy (blue) + Add to cart (orange → green when added) + ⋯ overflow
  - **Unlisted (non-owner)**: View (blue) + Offer (purple) + ⋯ overflow
  - **Owner**: View (blue) + List/Cancel icon + ⋯ with Transfer
- ⋯ menu: View asset · Make an offer · Add to cart · Remix this IP · List/Cancel · Transfer · View collection · View owner (Voyager) · View creator · Report
- Token title doubled in size (`text-xl font-bold`) with `line-clamp-2` for creative visual impact
- Creator attribution "by 0xAddress" from IPFS `Creator` attribute
- Ownership auto-detected on collection pages via `token.owner` vs connected wallet

### Collections
- Browse all NFT collections with sort options: Recent (default), Most assets, Top volume, Floor price, A→Z
- Filter by verified collections only
- Collection pages with `aspect-video` parallax banner, animated stats, and sticky tabs (Items / Listings / Offers)
- Collection Items tab detects ownership per-token, so owners see List/Cancel/Transfer dialogs directly from the grid
- Infinite scroll with "Load more" pagination, showing remaining count
- Creator profile pages with address-derived color identity and blurred asset banner

### Creators
- Dedicated `/creators` page showcasing verified creators in a 4-column card grid
- Creator cards display banner, avatar, bio, and social links
- Creator profile page: horizontal collection carousels with `w-64` cards (~4.5 visible), vertical `aspect-[3/4]` collection cover matching frontpage style
- Creators without uploaded images automatically fall back to their latest collection image
- Profile pages with activity timeline, owned assets, collections, and listing history

### Remix Licensing
- Request remix licenses from asset creators with fully configurable terms (license type, commercial use, derivatives, royalty %, proposed fee)
- Full remix creation page at `/create/remix/[contract]/[tokenId]`, adapting its flow to owner or non-owner:
  - **Owner (self-remix)**: upload custom artwork, set name/description/IP type/license, mint as a new digital asset, recorded on-chain with parent attribution
  - **Non-owner**: propose license terms + payment amount, creator receives notification and can approve/reject
- Open-license assets (CC0, CC BY, CC BY-SA, CC BY-NC) auto-approve, letting the creator focus on the ones that need a decision
- Parent attribution embedded in remix metadata as `Parent Contract` + `Parent Token ID` attributes, displayed as a banner on remix asset pages
- Portfolio Remixes page (`/portfolio/remix-offers`) with incoming requests (creator view with Approve/Reject) and outgoing requests (requester view), status badges covering all 7 states
- Remix count badge on portfolio nav link for pending requests

### Self-Custody Wallet (MediaWallet)
- Every account starts with an email at `/connect` — the only thing required to register. A wallet is deployed for that account next, as its own step, never the other way around; a signed-in account with no email is redirected back to `/connect` to add one before it can use anything else
- One-time setup: a WebAuthn passkey (Face ID / Touch ID / Windows Hello) derives an owner key via the PRF extension, sealed client-side with AES-GCM, staying encrypted on the device at all times
- Wallet is deployed onchain by a backend relayer via Starknet's Universal Deployer Contract, sponsored so setup costs the user nothing; the account is owned by the user from the first block
- SIWS (Sign-In With Starknet): a passkey-signed message authenticates the wallet to the Medialane backend as a single combined step
- Every transaction after setup is signed with the same passkey and paid for by the wallet itself; deposit STRK/ETH to it like any external Starknet wallet, via the Receive dialog's QR code

### Interoperability
- ERC-721 standard, compatible with any Starknet wallet, explorer, and marketplace
- OpenSea metadata standard: name, description, image, external_url, attributes
- IPFS storage, keeping assets permanently accessible directly from the network
- Berne Convention compliance, with immutable IP protection data embedded in every token

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| Wallet | MediaWallet: self-custody, WebAuthn passkey owner key, SIWS auth |
| Blockchain | Starknet Mainnet via starknet.js |
| SDK | `@medialane/sdk`, for marketplace + API operations |
| IPFS | Pinata, uploaded via medialane-backend's metered `/v1/metadata/*` API |
| State | Zustand (cart) + SWR (server state) |
| Toasts | Sonner |
| Animations | Framer Motion + tailwindcss-animate |

---

## Architecture

```
User (device passkey)
  └─ MediaWallet (self-custody, passkey-sealed owner key)
       ├─ First use: backend relayer deploys the wallet onchain (UDC), then SIWS signs the user in
       ├─ Create/asset page
       │    └─ POST /api/pinata (Next.js server route, SIWS-authenticated)
       │         └─ medialane-backend /v1/metadata/* (metered Pinata upload)
       │              └─ Pinata → IPFS (image + metadata JSON)
       │                   └─ ipfs:// URI → mint tx on Starknet
       └─ Marketplace operations
            └─ SNIP-12 signing → medialane-backend (Railway)
                 └─ Starknet Mainnet (onchain)
```

Every Pinata write goes through medialane-backend's `/v1/metadata/*` API, metered against the same tenant key as every other write in the app.

---

## IP Metadata Schema

Every Medialane NFT stores the following as ERC-721 `attributes` in IPFS:

```json
{
  "name": "My Creative Work",
  "description": "...",
  "image": "ipfs://...",
  "external_url": "https://medialane.io",
  "attributes": [
    { "trait_type": "Platform",        "value": "Medialane" },
    { "trait_type": "Network",         "value": "Starknet Mainnet" },
    { "trait_type": "IP Type",         "value": "Music" },
    { "trait_type": "License",         "value": "CC BY-NC-SA" },
    { "trait_type": "Commercial Use",  "value": "No" },
    { "trait_type": "Derivatives",     "value": "Share-Alike" },
    { "trait_type": "Attribution",     "value": "Required" },
    { "trait_type": "Territory",       "value": "Worldwide" },
    { "trait_type": "AI Policy",       "value": "Not Allowed" },
    { "trait_type": "Royalty",         "value": "10%" },
    { "trait_type": "Standard",        "value": "Berne Convention" },
    { "trait_type": "Registration",    "value": "2026-03-06" }
  ]
}
```

This keeps licensing terms **immutable** and **machine-readable** by any platform that understands the OpenSea standard.

---

## Supported Licenses

| License | Commercial | Derivatives | Attribution |
|---|---|---|---|
| All Rights Reserved | No | Not Allowed | Required |
| CC0 (Public Domain) | Yes | Allowed | Not Required |
| CC BY | Yes | Allowed | Required |
| CC BY-SA | Yes | Share-Alike | Required |
| CC BY-NC | No | Allowed | Required |
| CC BY-ND | Yes | Not Allowed | Required |
| CC BY-NC-SA | No | Share-Alike | Required |
| CC BY-NC-ND | No | Not Allowed | Required |
| MIT | Yes | Allowed | Required |
| Apache 2.0 | Yes | Allowed | Required |
| Custom | User-defined | User-defined | User-defined |

---

## Supported Payment Tokens

| Token | Network | Address |
|---|---|---|
| USDC (native) | Starknet Mainnet | `0x033068f6...` |
| USDT | Starknet Mainnet | `0x068f5c6a...` |
| ETH | Starknet Mainnet | `0x049d3657...` |
| STRK | Starknet Mainnet | `0x04718f5a...` |
| WBTC | Starknet Mainnet | `0x03fe2b97...` |

---

## Getting Started (Local Development)

```bash
# Clone and install
git clone https://github.com/medialane-io/medialane-io
cd medialane-io
bun install

# Configure environment
cp .env.example .env.local
# Fill in SIWS, Pinata, Starknet RPC, and backend URL

# Start dev server
bun dev
```

## Local Verification

Use Bun as the source-of-truth package manager for this repo.

```bash
bun run typecheck
bun run build
bun run lint
```

Notes:

- `bun.lock` is the canonical lockfile used for deploys
- `next/font/google` fetches remote fonts during builds, so fully offline build environments may need a network connection or a future self-hosted font setup

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `SIWS_SECRET` | SIWS (Sign-In With Starknet) token verification secret, matching medialane-backend's |
| `NEXT_PUBLIC_MEDIALANE_BACKEND_URL` | Medialane API base URL |
| `NEXT_PUBLIC_MEDIALANE_API_KEY` | Medialane API key (from portal) |
| `NEXT_PUBLIC_STARKNET_RPC_URL` | Starknet RPC endpoint |

Marketplace and collection contract addresses are sourced entirely from `@medialane/sdk`.

### Commands

```bash
bun dev          # Development server (port 3000)
bun run build    # Production build
bun start        # Start production server
bun lint         # ESLint
```

---

## Project Structure

```
src/
  app/
    api/pinata/       # Universal digital asset upload (SIWS-gated, proxies to medialane-backend)
    api/rpc/          # Same-origin Starknet RPC proxy (keyed endpoint stays server-side)
    api/proxy/        # Same-origin proxy for the rest of /v1/* — also sets/reads the account session cookie
    asset/            # /asset/[contract]/[tokenId]: dispatcher routes to POP/Drop/Edition/Standard page
    connect/          # Email registration/login; also the add-email step for a signed-in account with none
    create/           # /create/asset + /create/collection + /create/remix/[contract]/[tokenId]
    marketplace/      # /marketplace: browse + filter + search
    portfolio/        # /portfolio: owned tokens, listings, offers, activity, remix-offers
    wallet-onboarding/ # Passkey creation → relayer deploy → SIWS sign-in
    ...
  components/
    wallet/           # WalletPanel, ReceiveFundsDialog, AddressQr
    marketplace/      # PurchaseDialog, ListingDialog, OfferDialog
    layout/           # AppSidebar (sidebar-07 shell)
    ui/               # shadcn/ui components
  hooks/
    use-wallet-native-session.ts # Wallet address/signer from the sealed passkey key
    use-wallet-write-action.ts   # Write-action status machine (idle/processing/confirming/success/error)
    use-marketplace.ts           # All write ops (list, offer, fulfill, cancel)
    use-siws-token.ts            # SIWS token mint/cache for identity-aware backend routes
    use-cart.ts                  # Zustand cart store (localStorage persist)
  lib/
    wallet/           # passkey.ts, account.ts, account-ops.ts, venue-signer.ts, deploy-relay.ts, guardian.ts
    siws-server.ts    # Server-side SIWS token verification (API routes)
    constants.ts      # Contract addresses, env vars, token list
    medialane-client.ts # @medialane/sdk singleton
    utils.ts          # ipfsToHttp, timeUntil, formatPrice, cn
  types/
    ip.ts             # LICENSE_TYPES, IP_TYPES, GEOGRAPHIC_SCOPES, AI_POLICIES, …
    index.ts          # Local app types (CartItem, etc.)
```

---

## Related Repositories

| Repo | Description |
|---|---|
| [medialane-backend](https://github.com/medialane-io/medialane-backend) | Starknet indexer + marketplace API (Bun + Hono + Prisma + PostgreSQL) |
| [medialane-starknet](https://github.com/medialane-io/medialane-starknet) | Wallet-sovereign Starknet app: creator launchpad + marketplace |
| [medialane-sdk](https://github.com/medialane-io/medialane-sdk) | TypeScript SDK (`@medialane/sdk`): `npm install @medialane/sdk` |
| [medialane-portal](https://github.com/medialane-io/medialane-portal) | Developer portal (API keys, webhooks, usage) |

---

## License

[MIT](LICENSE)

Built with love for the creative economy. Powered by Starknet ZK.
