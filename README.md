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
- Recent listings + on-chain activity feed side by side

### Creator Launchpad
- Mint IP assets (Art, Music, Video, Documents, Posts, Patents, Code, NFTs) to any collection
- Full programmable licensing form — CC variants, commercial use, derivatives, attribution, territory, AI policy, royalty %
- Licensing metadata embedded in IPFS as ERC-721 attributes (OpenSea-compatible + Berne Convention compliant)
- Direct Pinata upload — metadata stored on IPFS, not on centralized servers
- Create and deploy ERC-721 collections on Starknet (gasless)

### NFT Marketplace
- Browse, search, and filter all Medialane IP assets
- Buy NFTs directly or make offers with USDC, USDC.e, USDT, ETH, or STRK
- Batch cart checkout — buy multiple items in one PIN-authenticated session
- Accept, cancel, and manage listings and offers from the portfolio
- Asset pages with Details, License, Listings, Offers, and History tabs
- Dynamic color theming derived from the asset image (CSS custom properties, WCAG contrast-checked)
- Atmospheric blurred background on asset pages for immersive browsing
- Marketplace filters: currency, price range (min/max), order type (listings/offers)

### Collections
- Browse all NFT collections with sort options: Recent (default), Most assets, Top volume, Floor price, A→Z
- Filter by verified collections only
- Collection pages with `aspect-video` parallax banner, animated stats, and sticky tabs
- Infinite scroll with "Load more" pagination — shows remaining count
- Creator profile pages with address-derived color identity and blurred asset banner

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
                      └─ Starknet Mainnet (on-chain)
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
| USDC.e (bridged) | Starknet Mainnet | `0x053c9125...` |
| USDT | Starknet Mainnet | `0x068f5c6a...` |
| ETH | Starknet Mainnet | `0x049d3657...` |
| STRK | Starknet Mainnet | `0x04718f5a...` |

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
    create/           # /create/asset + /create/collection — launchpad forms
    marketplace/      # /marketplace — browse + filter + search
    portfolio/        # /portfolio — owned tokens, listings, offers, activity
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
