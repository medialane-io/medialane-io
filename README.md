<img width="1260" height="640" alt="Medialane — Programmable IP on Starknet" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# Medialane

**Creator Launchpad + NFT Marketplace for Programmable IP on Starknet**

Medialane is a consumer-grade Web3 application that lets creators mint, license, and trade intellectual property as NFTs — with no wallet required, gasless transactions, and immutable licensing embedded directly in IPFS metadata. Built on [Starknet](https://starknet.io) with ZK-powered scalability.

Live at [medialane.io](https://medialane.io)

---

## What is Medialane?

Medialane is a platform for the **creative economy on Starknet**. It bridges Web2 simplicity with Web3 ownership:

- **Creators** mint their work (art, music, video, documents, code, patents) as IP NFTs with programmable licensing terms embedded immutably in IPFS metadata
- **Collectors** browse, buy, and make offers on IP assets in a full-featured NFT marketplace
- **Licensing** is Berne Convention-compliant — commercial use, derivative rights, attribution, territory, AI policy, and royalty are all encoded as OpenSea-compatible ERC-721 attributes
- **No wallet needed** — accounts are email/social (Clerk) and wallets are created invisibly on first use via ChipiPay (SNIP-9 session keys for gasless transactions)

---

## Features

### Discover
- Full-width hero with kinetic headline, CTA buttons, live platform stats, and scrolling asset strip
- Featured collections bento grid with verified badges and floor prices
- Recent listings + onchain activity feed side by side

### Creator Launchpad
- Mint IP assets across 12 canonical IP types: Audio, Art, Video, Photography, NFT, Patents, Posts, Publications, Documents, RWA, Software, Custom
- Dynamic template fields per IP type — collapsed optional panel, smart defaults per category
- Full programmable licensing form — CC variants, commercial use, derivatives, attribution, territory, AI policy, royalty %
- Licensing metadata embedded in IPFS as ERC-721 attributes (OpenSea-compatible + Berne Convention compliant)
- Media tab on asset pages — embedded players for YouTube, Spotify, SoundCloud, TikTok
- Creator wallet address embedded in every asset as `{ trait_type: "Creator", value: walletAddress }`
- Direct Pinata upload — metadata stored on IPFS, not on centralized servers
- Create and deploy ERC-721 collections on Starknet (gasless)
- Collection metadata JSON uploaded to IPFS at creation time — `baseUri` set onchain so any dApp can resolve collection images permissionlessly

### NFT Marketplace
- Browse, search, and filter all Medialane IP assets
- Buy NFTs directly or make offers with USDC, USDT, ETH, STRK, or WBTC
- **Cart dialog** — centered modal with blurred atmospheric backdrop, item thumbnails, individual Buy buttons, and "Buy all N items" batch checkout with a single PIN
- Accept, cancel, and manage listings and offers from the portfolio
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
- Collection Items tab detects ownership per-token — owners see List/Cancel/Transfer dialogs directly from the grid
- Infinite scroll with "Load more" pagination — shows remaining count
- Creator profile pages with address-derived color identity and blurred asset banner

### Creators
- Dedicated `/creators` page showcasing verified creators in a 4-column card grid
- Creator cards display banner, avatar, bio, and social links
- Creator profile page: horizontal collection carousels with `w-64` cards (~4.5 visible), vertical `aspect-[3/4]` collection cover matching frontpage style
- Creators without uploaded images automatically fall back to their latest collection image
- Profile pages with activity timeline, owned assets, collections, and listing history

### Remix Licensing
- Request remix licenses from asset creators with fully configurable terms (license type, commercial use, derivatives, royalty %, proposed fee)
- Full remix creation page at `/create/remix/[contract]/[tokenId]` — detects owner vs non-owner and adapts the flow:
  - **Owner (self-remix)**: upload custom artwork, set name/description/IP type/license, mint as a new IP asset, recorded on-chain with parent attribution
  - **Non-owner**: propose license terms + payment amount, creator receives notification and can approve/reject
- Open-license assets (CC0, CC BY, CC BY-SA, CC BY-NC) auto-approve without creator action
- Parent attribution embedded in remix metadata as `Parent Contract` + `Parent Token ID` attributes — displayed as a banner on remix asset pages
- Portfolio Remixes page (`/portfolio/remix-offers`) — incoming requests (creator view with Approve/Reject) and outgoing requests (requester view) with status badges for all 7 states
- Remix count badge on portfolio nav link for pending requests

### Invisible Wallet (ChipiPay)
- Sign in with email, Google, or any Clerk-supported provider
- Wallet created on first use — protected by a 6-12 digit PIN (AES-encrypted key, never stored in plaintext)
- Passkey support as the primary wallet auth method (PIN as fallback)
- Session keys (SNIP-9) valid for 6 hours — single PIN to unlock a session, no per-transaction prompts
- Gasless transactions sponsored by ChipiPay

### Interoperability
- ERC-721 standard — compatible with any Starknet wallet, explorer, and marketplace
- OpenSea metadata standard — name, description, image, external_url, attributes
- IPFS storage — assets are permanently accessible regardless of Medialane infrastructure
- Berne Convention compliance — immutable IP protection data embedded in every token

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | Tailwind CSS + shadcn/ui (Radix) + Framer Motion |
| Auth | Clerk 6 (email, social, passkey) |
| Wallet | ChipiPay (`@chipi-stack/nextjs`) — invisible Starknet wallets |
| Blockchain | Starknet Mainnet via starknet.js |
| SDK | `@medialane/sdk` — marketplace + API operations |
| IPFS | Pinata — direct upload from Next.js API route (no backend hop) |
| State | Zustand (cart) + SWR (server state) |
| Toasts | Sonner |
| Animations | Framer Motion + tailwindcss-animate |

---

## Architecture

```
User (email/passkey)
  └─ Clerk Auth
       └─ ChipiPay (invisible Starknet wallet)
            ├─ Create/asset page
            │    └─ POST /api/pinata (Next.js server route)
            │         └─ Pinata → IPFS (image + metadata JSON)
            │              └─ ipfs:// URI → mint tx on Starknet
            └─ Marketplace operations
                 └─ SNIP-12 signing → medialane-backend (Railway)
                      └─ Starknet Mainnet (onchain)
```

Asset uploads go **directly to Pinata** from the Next.js server — the backend is never involved in the upload path. This keeps IP assets fully decentralized.

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

This makes licensing terms **immutable**, **machine-readable**, and **interoperable** with any platform that understands the OpenSea standard.

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
# Fill in Clerk, ChipiPay, Pinata, Starknet RPC, and backend URL

# Start dev server
bun dev
```

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CHIPI_API_KEY` | ChipiPay API key |
| `NEXT_PUBLIC_CLERK_TEMPLATE_NAME` | Must be `chipipay` |
| `NEXT_PUBLIC_MEDIALANE_BACKEND_URL` | Medialane API base URL |
| `NEXT_PUBLIC_MEDIALANE_API_KEY` | Medialane API key (from portal) |
| `NEXT_PUBLIC_STARKNET_RPC_URL` | Starknet RPC endpoint |
| `NEXT_PUBLIC_MARKETPLACE_CONTRACT` | Marketplace contract address |
| `NEXT_PUBLIC_COLLECTION_CONTRACT` | Collection factory contract address |
| `PINATA_JWT` | Pinata JWT (server-side, not exposed to client) |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Pinata IPFS gateway URL |

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
    api/pinata/       # Universal IP asset upload (Clerk-gated, direct Pinata)
    asset/            # /asset/[contract]/[tokenId] — asset detail page + License tab
    create/           # /create/asset + /create/collection + /create/remix/[contract]/[tokenId]
    marketplace/      # /marketplace — browse + filter + search
    portfolio/        # /portfolio — owned tokens, listings, offers, activity, remix-offers
    onboarding/       # /onboarding — wallet creation (passkey-first)
    ...
  components/
    chipi/            # WalletSetupDialog, SessionSetupDialog, PinDialog
    marketplace/      # PurchaseDialog, ListingDialog, OfferDialog
    layout/           # AppSidebar (sidebar-07 shell)
    ui/               # shadcn/ui components + PinInput
  hooks/
    use-session-key.ts      # Wallet derivation + SNIP-9 session keys
    use-marketplace.ts      # All write ops (list, offer, fulfill, cancel)
    use-chipi-transaction.ts # ChipiPay execution + status
    use-cart.ts             # Zustand cart store (localStorage persist)
  types/
    ip.ts             # LICENSE_TYPES, IP_TYPES, GEOGRAPHIC_SCOPES, AI_POLICIES, …
    index.ts          # Local app types (CartItem, etc.)
  lib/
    constants.ts      # Contract addresses, env vars, token list
    medialane-client.ts # @medialane/sdk singleton
    utils.ts          # ipfsToHttp, timeUntil, formatPrice, cn
```

---

## Related Repositories

| Repo | Description |
|---|---|
| [medialane-backend](https://github.com/medialane-io/medialane-backend) | Starknet indexer + marketplace API (Bun + Hono + Prisma + PostgreSQL) |
| [@medialane/sdk](https://github.com/medialane-io/sdk) | TypeScript SDK — `npm install @medialane/sdk` |
| [medialane-xyz](https://github.com/medialane-io/medialane-xyz) | Developer portal (API keys, webhooks, usage) |

---

## License

[MIT](LICENSE)

Built with love for the creative economy. Powered by Starknet ZK.
