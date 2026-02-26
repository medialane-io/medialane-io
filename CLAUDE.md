# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun dev          # Start dev server (Next.js)
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint

# No test runner is configured
```

All package management uses **Bun** (not npm/yarn). Use `bun add`, `bun remove`, etc.

## Architecture Overview

**Medialane** is a Starknet-based NFT marketplace and creator launchpad. It combines Web2 auth (Clerk) with Web3 wallet management (ChipiPay) for a gasless, abstracted blockchain UX.

### Key Integrations

- **Clerk** — Email/social authentication. Session JWTs are templated as `chipipay` for wallet derivation.
- **ChipiPay** (`@chipi-stack/nextjs`) — Manages Starknet wallets derived from Clerk sessions. Enables gasless transactions. Wraps the app via `ChipiProvider` in `src/app/providers.tsx`.
- **Starknet.js** — Direct contract calls. RPC singleton in `src/lib/starknet.ts`.
- **@medialane/sdk** — Local workspace package (`file:../medialane-sdk`). Provides `ApiOrder`, `ApiToken`, `ApiCollection`, `OrderStatus` types and the SDK client used in `src/lib/medialane-client.ts`.
- **Pinata** — IPFS uploads via `src/app/api/pinata/route.ts`. Handles file + metadata.

### Data Flow

1. User authenticates via Clerk → ChipiPay derives a Starknet wallet from the session
2. Session keys (SNIP-9) are stored in Clerk user metadata, managed via `use-session-key.ts`
3. Marketplace orders use SNIP-12 typed data signing (see `use-marketplace.ts`)
4. Cart state is persisted to localStorage via Zustand (`use-cart.ts`)
5. Server state (tokens, collections, orders) fetched via TanStack Query hooks in `src/hooks/`

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
- App providers (ChipiPay, theme, toast): `src/app/providers.tsx`

## UI Conventions

- Component library: **shadcn/ui** (Radix UI primitives) in `src/components/ui/`
- Styling: Tailwind CSS with CSS variable-based HSL color tokens; dark mode via `class` strategy
- Icons: `lucide-react`
- Animations: Framer Motion + `tailwindcss-animate`
- Toast notifications: `sonner`
- Custom utility classes (`.glass`, `.gradient-text`, `.asset-card-hover`) defined in `globals.css`
