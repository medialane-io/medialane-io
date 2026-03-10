# Asset Transfer Feature — Design Spec

**Date:** 2026-03-09
**Status:** Approved
**Scope:** Direct wallet-to-wallet ERC-721 transfer, gasless via ChipiPay, on Starknet mainnet

---

## Overview

Add a "Transfer" action to the asset detail page and the portfolio assets grid, allowing the NFT owner to send their asset to any raw Starknet address. The transfer is free (gas sponsored by ChipiPay) and irreversible. Recipient is specified as a raw `0x...` address.

---

## Architecture

### Transaction Flow

```
Owner clicks "Transfer"
  → TransferDialog opens (address input)
  → Owner enters recipient address + submits
  → PinDialog opens
  → Owner enters PIN
  → useTransfer.transferToken()
      → encodeTokenId(tokenId) → [low, high] for u256
      → executeTransaction({ contractAddress, calls: [transfer_from(from, to, id_low, id_high)], pin })
          → ChipiPay callAnyContractAsync (gasless, decrypts wallet key with PIN)
          → waitForTransaction (poll until confirmed/reverted)
  → On success: toast + SWR cache invalidation (immediate + delayed +10s)
  → TransferDialog shows success state with Voyager tx link
```

### Key Design Decisions

- **No backend intent required** — transfer is a direct ERC-721 contract call, not a marketplace operation. Skips the `createIntent → signTypedData → submitSignature` flow used by `useMarketplace`.
- **No session key (SNIP-9) required** — `callAnyContractAsync` uses the wallet's encrypted private key (decrypted with PIN), not the session key. Only `hasWallet` guard needed.
- **u256 tokenId encoding** — Starknet `u256` is two felt252 values in calldata: `[low_128_bits, high_128_bits]`. Token IDs are parsed from decimal or hex string.
- **ERC-721 entrypoint** — `transfer_from` (snake_case, OpenZeppelin Starknet standard). Verify against actual collection contract before shipping.

---

## New Files

### `src/hooks/use-transfer.ts`

```
useTransfer()
  ├── useChipiTransaction()   — execution layer
  ├── useSessionKey()         — walletAddress + hasWallet + wallet credentials
  └── useSWRConfig()          — cache invalidation
```

**Exports:**
- `transferToken(input: TransferInput): Promise<string | undefined>` — executes the transfer
- `walletAddress`, `hasWallet`, `isLoadingWallet` — wallet state passthrough
- `isProcessing`, `txStatus`, `txHash`, `error`, `resetState` — transaction state

**`TransferInput`:**
```typescript
{
  contractAddress: string   // NFT contract address
  tokenId: string           // Token ID (decimal or hex)
  toAddress: string         // Recipient Starknet address
  pin: string               // ChipiPay PIN to decrypt wallet key
}
```

**`encodeTokenId(tokenId: string): [string, string]`** — parses the token ID as BigInt, returns `[low, high]` as decimal strings for Starknet calldata.

**SWR invalidation** — after confirmed tx: wipe all keys matching `tokens-owned-*` or `token-*`. Repeat after 10s for indexer lag (same pattern as `useMarketplace`).

---

### `src/components/marketplace/transfer-dialog.tsx`

Follows `ListingDialog` structure exactly. Three internal states: **form → processing → success**.

**Props:**
```typescript
{
  open: boolean
  onOpenChange: (open: boolean) => void
  contractAddress: string
  tokenId: string
  tokenName?: string
  onSuccess?: () => void
}
```

**Form state:**
- Single address input: `toAddress` (string)
- Zod validation: starts with `0x`, valid hex chars, 1–64 hex chars after prefix, not equal to `walletAddress`
- Warning banner: "This action is irreversible. The asset will be permanently sent to the recipient address."
- Wallet guard: if `!hasWallet`, open `WalletSetupDialog` (no session key check needed)
- On valid submit → open `PinDialog` → call `transferToken()`

**Processing state:** Loader2 spinner + status text ("Submitting…" / "Confirming on Starknet…")

**Success state:** CheckCircle2 icon + "Transfer complete!" + token name + "View on Voyager" link + Done button

---

## Modified Files

### `src/components/shared/token-card.tsx`

Add `onTransfer?: (token: ApiToken) => void` prop to `TokenCardProps`.

When `isOwner && onTransfer`: render a small icon button with `ArrowRightLeft` icon alongside the existing owner actions ("List for sale"). Placed as a secondary action so it doesn't compete visually with the primary list action.

### `src/components/portfolio/assets-grid.tsx`

Add state:
```typescript
const [transferToken, setTransferToken] = useState<ApiToken | null>(null);
const [transferOpen, setTransferOpen] = useState(false);
```

Add handler:
```typescript
const handleTransfer = (token: ApiToken) => {
  setTransferToken(token);
  setTransferOpen(true);
};
```

Pass `onTransfer={handleTransfer}` to each `TokenCard`.
Render `<TransferDialog>` at bottom (same pattern as `ListingDialog`).
On success: call `mutate()` to refresh the owned tokens list.

### `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`

Add state:
```typescript
const [transferOpen, setTransferOpen] = useState(false);
```

In the owner's action box — both the "listed" and "not listed" branches — add a Transfer button below existing owner buttons:
```tsx
<Button variant="outline" className="w-full" onClick={() => setTransferOpen(true)}>
  <ArrowRightLeft className="h-4 w-4 mr-2" />
  Transfer
</Button>
```

`ArrowRightLeft` is already imported on this page.

Add `<TransferDialog>` to the dialogs section at the bottom.

---

## Validation Rules

| Rule | Detail |
|------|--------|
| Starts with `0x` | Required prefix for Starknet addresses |
| Valid hex | Only `[0-9a-fA-F]` after prefix |
| Length | 1–64 hex chars after `0x` |
| Not self | Recipient ≠ `walletAddress` (prevent sending to self) |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Wallet not set up | Opens `WalletSetupDialog` before PIN |
| Invalid address | Inline Zod form error, cannot submit |
| Wrong PIN | ChipiPay rejects, `error` state shown in dialog |
| TX reverted | `txStatus === "reverted"` → error toast + error shown in dialog |
| Network error | Caught in `useTransfer`, error toast via sonner |

---

## Out of Scope

- `.stark` name resolution (deferred — user confirmed raw address only for now)
- Batch transfer of multiple assets
- Transfer from portfolio list view without dialog (click-to-transfer)
- Price range filter in marketplace (separate backlog item)
