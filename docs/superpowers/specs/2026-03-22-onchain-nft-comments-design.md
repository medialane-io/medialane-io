# On-Chain NFT Comments — Design Spec

**Date:** 2026-03-22
**Status:** Draft v2

---

## Goal

Add a permissionless, gasless on-chain comment system to NFT asset pages on Medialane. Any wallet can post a comment to any NFT via a Starknet transaction (gas sponsored by AVNU paymaster through ChipiPay). Comments are permanent on-chain records — stored as Starknet events, indexed by the backend, and served through the API.

---

## Architecture

Four-layer system:

```
Cairo contract (event emitter) — medialane-contracts repo
  → backend mirror/indexer — medialane-backend
    → REST API + SDK type — @medialane/sdk
      → frontend tab component — medialane-io
```

Build order is strictly sequential: **contract → backend → SDK → frontend**.

**Tech Stack:**
- Cairo 2.11.4 + Scarb + Starknet Foundry (medialane-contracts)
- Hono + Prisma + PostgreSQL (medialane-backend)
- TypeScript SDK (@medialane/sdk)
- Next.js 15 + ChipiPay + SWR (medialane-io)

---

## Layer 1: Cairo Contract — NFTComments.cairo

### File Location

Repository: `/Users/kalamaha/dev/medialane-contracts`
File: `contracts/Medialane-Protocol/src/comments/nft_comments.cairo`

Add to `contracts/Medialane-Protocol/src/lib.cairo`:
```cairo
pub mod comments {
    pub mod nft_comments;
}
```

### Contract Code

Deployed once to Starknet mainnet. Pure event emitter — no storage. All comment data lives permanently in Starknet event logs. Includes `UpgradeableComponent` and `OwnableComponent` (already in `Scarb.toml` via `openzeppelin_upgrades = "2.0.0"` and `openzeppelin_access = "2.0.0"`) so bugs can be patched without redeploying to a new address.

```cairo
use starknet::ContractAddress;

#[starknet::interface]
trait INFTComments<TContractState> {
    fn add_comment(
        ref self: TContractState,
        nft_contract: ContractAddress,
        token_id: u256,
        content: ByteArray,
    );
    // upgrade is NOT in this trait — it uses OwnableComponent's assert_only_owner
    // and UpgradeableComponent::UpgradeableImpl directly (infrastructure, not feature API)
}

#[starknet::contract]
mod NFTComments {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp, ClassHash};
    use core::num::traits::Zero;
    use openzeppelin_upgrades::UpgradeableComponent;
    use openzeppelin_access::ownable::OwnableComponent;

    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;
    #[abi(embed_v0)]
    impl UpgradeableImpl = UpgradeableComponent::UpgradeableImpl<ContractState>;
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CommentAdded: CommentAdded,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        OwnableEvent: OwnableComponent::Event,
    }

    #[derive(Drop, starknet::Event)]
    struct CommentAdded {
        #[key] nft_contract: ContractAddress,
        #[key] token_id: u256,
        #[key] author: ContractAddress,
        content: ByteArray,
        timestamp: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl NFTCommentsImpl of super::INFTComments<ContractState> {
        fn add_comment(
            ref self: ContractState,
            nft_contract: ContractAddress,
            token_id: u256,
            content: ByteArray,
        ) {
            assert!(!nft_contract.is_zero(), "invalid nft contract");
            assert!(content.len() > 0, "comment cannot be empty");
            assert!(content.len() <= 1000, "comment too long");
            // get_caller_address() is never zero on Starknet (protocol guarantee)
            self.emit(CommentAdded {
                nft_contract,
                token_id,
                author: get_caller_address(),
                content,
                timestamp: get_block_timestamp(),
            });
        }

    }
}
```

### CommentAdded Event Key Layout

When Starknet serializes this event, keys are laid out as:
```
keys[0] = selector("CommentAdded")          // event selector
keys[1] = nft_contract (felt252)
keys[2] = token_id.low (felt252)             // u256 serializes as two felts
keys[3] = token_id.high (felt252)
keys[4] = author (felt252)
```
Data fields (`content` as ByteArray, `timestamp` as u64) appear in `event.data`.

### Security Notes

- `get_caller_address()` is never zero on Starknet (protocol guarantee) — no zero-address check on author.
- `nft_contract.is_zero()` check requires `use core::num::traits::Zero`.
- `ByteArray` cannot be in `starknet::Store` structs — the pure events design sidesteps this constraint entirely.
- `token_id: u256` matches ERC-721 convention; serializes as two felt252 values in event keys.
- No external contract calls → no reentrancy surface.
- No ETH/token handling → no financial attack surface.
- Content sanitization (encoding, Unicode) is a backend/frontend responsibility.
- Spam mitigation: AVNU paymaster rate-limits at the policy level; the 1000-byte cap limits per-comment chain cost.
- `content.len()` counts bytes (not Unicode code points). The 1000-byte limit is deliberately a byte limit so it matches the frontend's `TextEncoder` byte check.

### Deployment

- Add `pub mod comments { pub mod nft_comments; }` to `src/lib.cairo`.
- Compile: `scarb build`
- Test: `snforge test`
- Deploy to Starknet mainnet using Starkli, passing deployer address as `owner` constructor arg.
- Set `COMMENTS_CONTRACT_ADDRESS` in medialane-backend Railway env.
- Set `COMMENTS_START_BLOCK` in medialane-backend Railway env (the deployment block — prevents scanning from block 0).
- Set `NEXT_PUBLIC_COMMENTS_CONTRACT` in medialane-io Vercel env.

---

## Layer 2: Backend — medialane-backend

### 2a. Prisma Schema — New Comment Model

```prisma
model Comment {
  id              String   @id @default(cuid())
  chain           String   @default("starknet")
  contractAddress String
  tokenId         String
  author          String
  content         String
  isHidden        Boolean  @default(false)
  txHash          String?
  blockNumber     BigInt
  blockTimestamp  BigInt   // unix seconds from chain event (on-chain post time)
  logIndex        Int
  createdAt       DateTime @default(now())  // indexing time — for internal use only

  @@unique([txHash, logIndex])
  @@index([chain, contractAddress, tokenId])
  @@index([author])
}
```

Migration: `prisma migrate dev --name add_comment_model`

Notes:
- `isHidden` allows admin moderation without altering immutable on-chain data.
- `@@unique([txHash, logIndex])` ensures idempotent upserts (same event indexed twice → no duplicate).
- `chain` is a plain string (not an enum) to avoid Prisma enum casting issues with `$queryRaw`.

### 2b. Environment Constants

Add to `src/lib/constants.ts` (backend):
```ts
export const COMMENTS_CONTRACT_ADDRESS = process.env.COMMENTS_CONTRACT_ADDRESS ?? "";
export const COMMENTS_START_BLOCK = parseInt(process.env.COMMENTS_START_BLOCK ?? "0", 10);
```

### 2c. Mirror/Indexer Changes

**Architecture:** The mirror uses a dedicated polling function per contract — not `fromAddress` checks inside the main `parser.ts`. Add a new file:

**`src/mirror/pollCommentEvents.ts`** — new file:
```ts
import { provider } from "../lib/starknet";
import { COMMENTS_CONTRACT_ADDRESS, COMMENTS_START_BLOCK } from "../lib/constants";
import { byteArray } from "starknet";
import { normalizeAddress } from "../lib/utils";

export async function pollCommentEvents(fromBlock: number, toBlock: number): Promise<ParsedComment[]> {
  if (!COMMENTS_CONTRACT_ADDRESS) return [];

  const events = await provider.getEvents({
    address: COMMENTS_CONTRACT_ADDRESS,
    from_block: { block_number: Math.max(fromBlock, COMMENTS_START_BLOCK) },
    to_block: { block_number: toBlock },
    chunk_size: 100,
  });

  // Compute logIndex as per-transaction counter (same approach as existing marketplace parser)
  const txCounters: Record<string, number> = {};

  return events.events.map((event) => {
    // keys layout: [selector, nft_contract, token_id.low, token_id.high, author]
    const nftContract = normalizeAddress(event.keys[1]);
    const tokenIdLow = BigInt(event.keys[2]);
    const tokenIdHigh = BigInt(event.keys[3]);
    const tokenId = (tokenIdHigh << 128n) | tokenIdLow;
    const author = normalizeAddress(event.keys[4]);

    // data layout: ByteArray (variable length), then timestamp (u64 — last felt)
    // Parse timestamp from tail — immune to ByteArray length variance.
    // byteArray.stringFromByteArray is a starknet.js v6 named export.
    const dataArr = event.data;
    const blockTimestamp = parseInt(dataArr[dataArr.length - 1], 16);
    const byteArrayData = dataArr.slice(0, dataArr.length - 1);
    const content = byteArray.stringFromByteArray(byteArrayData);

    // Per-transaction logIndex: counts events from this contract within the same tx
    const txHash = event.transaction_hash; // always present from getEvents()
    const logIndex = txCounters[txHash] ?? 0;
    txCounters[txHash] = logIndex + 1;

    return {
      nftContract,
      tokenId: tokenId.toString(),
      author,
      content,
      blockTimestamp,
      txHash,
      blockNumber: BigInt(event.block_number ?? 0),
      logIndex,
    };
  });
}

export interface ParsedComment {
  nftContract: string;
  tokenId: string;
  author: string;
  content: string;
  blockTimestamp: number;  // unix seconds from the CommentAdded event
  txHash: string;          // always present from getEvents() — non-nullable
  blockNumber: bigint;
  logIndex: number;
}
```

**`src/orchestrator/jobs/handleCommentAdded.ts`** — new job handler:
```ts
import { db } from "../../lib/db";
import { normalizeAddress } from "../../lib/utils";
import type { ParsedComment } from "../../mirror/pollCommentEvents";

export async function handleCommentAdded(comment: ParsedComment): Promise<void> {
  // Sanitize: strip null bytes and control characters
  const content = comment.content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  if (!content) return;

  await db.comment.upsert({
    where: { txHash_logIndex: { txHash: comment.txHash, logIndex: comment.logIndex } },
    create: {
      chain: "starknet",
      contractAddress: normalizeAddress(comment.nftContract),
      tokenId: comment.tokenId,
      author: normalizeAddress(comment.author),
      content,
      txHash: comment.txHash,
      blockNumber: comment.blockNumber,
      blockTimestamp: BigInt(comment.blockTimestamp),
      logIndex: comment.logIndex,
    },
    update: {}, // no updates — events are immutable
  });
}
```

**`src/orchestrator/index.ts`** — register new job type `COMMENT_ADDED` and call `pollCommentEvents` in the main indexer loop alongside existing event polling.

### 2d. REST Route — `src/api/routes/comments.ts`

```
GET /v1/tokens/:contract/:tokenId/comments
  Query:    ?page=1&limit=20
  Response: { data: ApiComment[], meta: { page, limit, total } }
  Order:    createdAt DESC (newest first)
  Auth:     none (public read)
  Filter:   WHERE isHidden = false
```

No write route on the backend — writes go directly on-chain. The backend is a read-only indexed view of the chain.

Pagination follows the same `page`/`limit` convention used by all other Medialane API routes (not cursor-based).

---

## Layer 3: SDK — @medialane/sdk

### New Type

```ts
export interface ApiComment {
  id: string;
  chain: string;              // "starknet"
  contractAddress: string;    // normalized 0x-padded Starknet address
  tokenId: string;
  author: string;             // normalized 0x-padded Starknet address
  content: string;            // sanitized comment text
  txHash: string | null;
  blockNumber: string;        // BigInt serialized as string
  postedAt: string;           // ISO 8601 derived from blockTimestamp — use this for display
}
```

### New Client Method

```ts
// On MedialaneClient.api:
getTokenComments(
  contract: string,
  tokenId: string,
  opts?: { page?: number; limit?: number }
): Promise<ApiResponse<ApiComment[]>>
```

Publish as `@medialane/sdk@0.4.8`.

---

## Layer 4: Frontend — medialane-io

### 4a. Environment Constant

Add to `src/lib/constants.ts`:
```ts
export const COMMENTS_CONTRACT = process.env.NEXT_PUBLIC_COMMENTS_CONTRACT ?? "";
export const EXPLORER_URL = "https://voyager.online/tx";
```

### 4b. Hook — `src/hooks/use-comments.ts`

```ts
import useSWR from "swr";
import { useMedialaneClient } from "@/lib/medialane-client";

export function useTokenComments(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();
  const key = contract && tokenId ? `comments-${contract}-${tokenId}` : null;
  const { data, isLoading, error, mutate } = useSWR(
    key,
    () => client.api.getTokenComments(contract!, tokenId!),
    {
      refreshInterval: 15000,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );
  return { comments: data?.data ?? [], isLoading, error, mutate };
}
```

### 4c. Component — `src/components/asset/comments-section.tsx`

**Calldata encoding** (for `useChipiTransaction`):

`CallData.compile()` from starknet.js v6 handles Cairo 2 / Sierra v2 ABI contracts automatically — no manual felt array construction needed.

```ts
import { byteArray, cairo, CallData } from "starknet";

const calldata = CallData.compile({
  nft_contract: contract,                          // felt252
  token_id: cairo.uint256(BigInt(tokenId)),        // u256 → two felts
  content: byteArray.byteArrayFromString(text),   // ByteArray encoding
});
```

**Wallet gate (three states):**
1. Not signed in → show "Sign in to comment" (links to Clerk sign-in)
2. Signed in but no wallet → show "Set up your wallet to comment" (opens `WalletSetupDialog`)
3. Signed in with wallet → show the comment form

**Post form:**
- Textarea (max validation: `new TextEncoder().encode(value).length <= 1000` bytes, not `.length` chars).
- Character counter showing bytes remaining: `1000 - new TextEncoder().encode(value).length`.
- Submit triggers `useChipiTransaction` + `PinDialog` (existing pattern — see `src/components/chipi/pin-dialog.tsx` and `src/hooks/use-chipi-transaction.ts`).
- While submitting: spinner, textarea disabled.
- On success: `mutate()` + `setTimeout(() => mutate(), 10000)` (same delayed-revalidation pattern used after order writes).

**Comment list:**
- Each row shows `<AddressDisplay>` (author, 6 chars), comment text, `timeAgo(postedAt)` (on-chain time, not indexing time), and an external link icon to `${EXPLORER_URL}/${comment.txHash}` (opens Voyager in new tab; only shown when `txHash` is non-null).

**Empty state:** "Be the first to leave a comment."

**Loading state:** 3 skeleton rows.

**Content rendering:** Treat `content` as plain text only — no markdown, no HTML. Use `whitespace-pre-wrap` for line breaks. Escape before rendering.

### 4d. Asset Page — Add Comments Tab

File: `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`

Add a **Comments** tab between Markets and Provenance:
- Tab trigger: `Comments` with a count badge when `comments.length > 0`.
- Tab content: `<CommentsSection contract={contract} tokenId={tokenId} />`.
- `useTokenComments` called unconditionally (not lazy) so the count badge is populated without the user visiting the tab first.

---

## Data Flow

```
User types comment → textarea (byte-length validation)
→ Submit → PinDialog (existing ChipiPay PIN pattern)
→ useChipiTransaction → AVNU paymaster (gasless)
→ Starknet tx → NFTComments.add_comment(nft_contract, token_id, content)
→ CommentAdded event emitted on-chain (permanent)
→ Backend pollCommentEvents() picks up event on next indexer tick (~6s)
→ handleCommentAdded stores in Comment table (upsert, idempotent)
→ Frontend mutate() re-fetches after 10s delay
→ Comment appears in list
```

---

## Out of Scope — v1

- Replies / threading (flat list only)
- Reactions / likes
- Delete — comments are immutable on-chain; `isHidden` in the DB allows admin moderation without altering chain data
- Notifications for comment on owned NFT
- Comment on collections (token-level only)

---

## Build Order

Each step is a hard dependency on the previous.

1. **Cairo contract** — add `pub mod comments { pub mod nft_comments; }` to `lib.cairo`, write `nft_comments.cairo`, compile (`scarb build`), test (`snforge test`), deploy to mainnet, record contract address.
2. **Backend** — add `COMMENTS_CONTRACT_ADDRESS` + `COMMENTS_START_BLOCK` constants, schema migration, `pollCommentEvents.ts`, `handleCommentAdded.ts` job, orchestrator registration, REST route, tests.
3. **SDK** — `ApiComment` type, `getTokenComments` method, publish v0.4.8.
4. **Frontend** — add `COMMENTS_CONTRACT` + `EXPLORER_URL` constants, `use-comments.ts` hook, `comments-section.tsx` component, asset page tab.
