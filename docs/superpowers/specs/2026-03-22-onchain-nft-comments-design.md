# On-Chain NFT Comments — Design Spec

**Date:** 2026-03-22
**Status:** Draft

---

## Goal

Add a permissionless, gasless on-chain comment system to NFT asset pages on Medialane. Any wallet can post a comment to any NFT via a Starknet transaction (gas sponsored by AVNU paymaster through ChipiPay). Comments are permanent on-chain records — stored as Starknet events, indexed by the backend, and served through the API.

---

## Architecture

Four-layer system:

```
Cairo contract (event emitter)
  → backend mirror/indexer
    → REST API + SDK type
      → frontend tab component
```

Build order is strictly sequential: **contract → backend → SDK → frontend**.

**Tech Stack:**
- Cairo 2.x (Starknet)
- Hono + Prisma + PostgreSQL (medialane-backend)
- TypeScript SDK (@medialane/sdk)
- Next.js 15 + ChipiPay + SWR (medialane-io)

---

## Layer 1: Cairo Contract — NFTComments.cairo

Deployed once to Starknet mainnet. Pure event emitter — no storage. All comment data lives permanently in Starknet event logs.

```cairo
use starknet::ContractAddress;
use core::num::traits::Zero;

#[starknet::interface]
trait INFTComments<TContractState> {
    fn add_comment(
        ref self: TContractState,
        nft_contract: ContractAddress,
        token_id: u256,
        content: ByteArray,
    );
}

#[starknet::contract]
mod NFTComments {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::num::traits::Zero;

    #[storage]
    struct Storage {}  // stateless — all data lives in events

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        CommentAdded: CommentAdded,
    }

    #[derive(Drop, starknet::Event)]
    struct CommentAdded {
        #[key] nft_contract: ContractAddress,
        #[key] token_id: u256,
        #[key] author: ContractAddress,
        content: ByteArray,
        timestamp: u64,
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

### Security Notes

- `get_caller_address()` is never zero on Starknet (protocol guarantee) — no zero-address check needed on author.
- `nft_contract.is_zero()` check requires `use core::num::traits::Zero` import.
- `ByteArray` cannot be in `starknet::Store` structs — the pure events design sidesteps this constraint entirely.
- `token_id: u256` matches ERC-721 convention; serializes as two felt252 values in event keys.
- No external contract calls → no reentrancy surface.
- No ETH/token handling → no financial attack surface.
- Content sanitization (encoding, Unicode) is a backend/frontend responsibility.
- Spam mitigation: AVNU paymaster rate-limits at the policy level; the 1000-byte cap limits per-comment chain cost.
- Post-deploy: add `UpgradeableComponent` (OpenZeppelin Cairo) so bugs can be patched without deploying to a new contract address.

### Deployment

- Compile and test with Scarb + Starknet Foundry, then deploy to Starknet mainnet using Starkli.
- Set `COMMENTS_CONTRACT_ADDRESS` in medialane-backend Railway env.
- Set `NEXT_PUBLIC_COMMENTS_CONTRACT` in medialane-io Vercel env.

---

## Layer 2: Backend — medialane-backend

### 2a. Prisma Schema — New Comment Model

```prisma
model Comment {
  id              String   @id @default(cuid())
  chain           Chain    @default(STARKNET)
  contractAddress String
  tokenId         String
  author          String
  content         String
  txHash          String?  @unique
  blockNumber     BigInt
  logIndex        Int
  createdAt       DateTime @default(now())

  @@index([chain, contractAddress, tokenId])
  @@index([author])
}
```

Migration: `prisma migrate dev --name add_comment_model`

### 2b. Mirror/Indexer Changes

**`src/mirror/parser.ts`** — add `CommentAdded` event case:
- Check if `event.fromAddress` matches `COMMENTS_CONTRACT_ADDRESS`.
- Parse keys: `nft_contract` (felt252), `token_id` (two felts → u256), `author` (felt252).
- Parse data: `content` (ByteArray — variable length felts), `timestamp` (u64).
- Return a `ParsedComment` object.

**`src/orchestrator/jobs/handleCommentAdded.ts`** — new job handler:
- Receives `ParsedComment`.
- Normalizes addresses (64-char 0x-padded).
- Upserts `Comment` in DB (idempotent on `txHash`).
- No downstream jobs needed.

**`src/orchestrator/index.ts`** — register new job type `COMMENT_ADDED`.

### 2c. REST Route — `src/api/routes/comments.ts`

```
GET /v1/tokens/:contract/:tokenId/comments
  Query:    ?limit=20&cursor=<lastId>
  Response: { data: ApiComment[], meta: { hasMore, nextCursor } }
  Order:    createdAt DESC (newest first)
  Auth:     none (public read)
```

No write route on the backend — writes go directly on-chain. The backend is a read-only indexed view of the chain.

Content sanitization: strip null bytes and control characters before storing. The frontend must also escape content before rendering (treat as untrusted user input).

---

## Layer 3: SDK — @medialane/sdk

### New Type

```ts
export interface ApiComment {
  id: string;
  contractAddress: string;
  tokenId: string;
  author: string;       // normalized 0x-padded Starknet address
  content: string;      // sanitized comment text
  txHash: string | null;
  blockNumber: string;
  createdAt: string;    // ISO 8601
}
```

### New Client Method

```ts
// On MedialaneClient.api:
getTokenComments(
  contract: string,
  tokenId: string,
  opts?: { limit?: number; cursor?: string }
): Promise<ApiResponse<ApiComment[]>>
```

Publish as `@medialane/sdk@0.4.8`.

---

## Layer 4: Frontend — medialane-io

### 4a. Hook — `src/hooks/use-comments.ts`

```ts
export function useTokenComments(contract: string | null, tokenId: string | null) {
  const client = useMedialaneClient();
  const key = contract && tokenId ? `comments-${contract}-${tokenId}` : null;
  const { data, isLoading, error, mutate } = useSWR(
    key,
    () => client.api.getTokenComments(contract!, tokenId!),
    { refreshInterval: 15000 }
  );
  return { comments: data?.data ?? [], isLoading, error, mutate };
}
```

### 4b. Component — `src/components/asset/comments-section.tsx`

**Post form** (wallet-gated):
- Textarea (max 1000 chars) + character counter + Submit button.
- Submit triggers `useChipiTransaction` calling `add_comment` on `NEXT_PUBLIC_COMMENTS_CONTRACT`.
- While submitting: spinner, textarea disabled.
- On success: `mutate()` + `setTimeout(() => mutate(), 10000)` (same delayed-revalidation pattern used after order writes).
- No wallet: show "Sign in to comment".

**Comment list:**
- Each row shows `AddressDisplay` (author, 6 chars), comment text, `timeAgo(createdAt)`, and an external link to the Voyager tx.

**Empty state:** "Be the first to leave a comment."

**Loading state:** 3 skeleton rows.

**Content rendering:** Treat `content` as plain text only — no markdown, no HTML. Use `whitespace-pre-wrap` for line breaks.

### 4c. Asset Page — Add Comments Tab

File: `src/app/asset/[contract]/[tokenId]/asset-page-client.tsx`

Add a **Comments** tab between Markets and Provenance:
- Tab trigger: `Comments` with a count badge when `comments.length > 0`.
- Tab content: `<CommentsSection contract={contract} tokenId={tokenId} />`.
- `useTokenComments` called unconditionally (not lazy) so the count badge is populated without the user visiting the tab first.

---

## Data Flow

```
User types comment → textarea
→ Submit → useChipiTransaction → AVNU paymaster (gasless)
→ Starknet tx → NFTComments.add_comment(nft_contract, token_id, content)
→ CommentAdded event emitted on-chain (permanent)
→ Backend mirror picks up event on next tick (~6s)
→ handleCommentAdded stores in Comment table
→ Frontend mutate() re-fetches after 10s delay
→ Comment appears in list
```

---

## Out of Scope — v1

- Replies / threading (flat list only in v1)
- Reactions / likes
- Moderation / delete — comments are immutable on-chain; the backend can add an `isHidden` flag for admin moderation without altering on-chain data
- Notifications for comment on owned NFT
- Comment on collections (token-level only)

---

## Build Order

Each step is a hard dependency on the previous.

1. **Cairo contract** — compile, test with Starknet Foundry, deploy to mainnet, record the contract address.
2. **Backend** — schema migration, parser case, job handler, route, tests.
3. **SDK** — `ApiComment` type, `getTokenComments` method, publish v0.4.8.
4. **Frontend** — hook, component, asset page tab.
