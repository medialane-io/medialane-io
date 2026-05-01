# Medialane.io Live QA Checklist

Date: 2026-04-27

Purpose: validate the current `medialane-io` refactor work against real product behavior on live infrastructure, with a bias toward catching high-value regressions quickly and turning them into targeted fixes.

Companion documents:

- [Refactor Audit](/Users/kalamaha/dev/medialane-io/docs/medialane-io-refactor-audit-2026-04-26.md)
- [Implementation Plan](/Users/kalamaha/dev/medialane-io/docs/medialane-io-implementation-plan-2026-04-26.md)

## QA Principles

1. test the primary creator and collector loops first
2. validate protocol routing and wallet/session continuity before visual polish
3. capture exact repro steps for every issue
4. prefer small follow-up fixes over reopening broad refactors

## Test Setup

Before starting:

- confirm Vercel is on the latest `medialane-io`
- confirm Railway is on the latest backend config
- confirm production env vars use canonical naming
- sign in with at least 2 accounts:
  - creator/owner account
  - secondary collector account
- ensure both accounts can complete Chipi wallet setup
- keep a note of:
  - one ERC-721 collection/token
  - one ERC-1155 collection/token
  - one fresh collection-drop launch
  - one fresh POP event

Useful data to capture during testing:

- wallet address used
- asset or collection contract
- token ID
- tx hash
- page URL
- exact visible error message

## Pass/Fail Template

For each test, record:

- `Pass`
- `Fail`
- `Needs follow-up`

If not `Pass`, record:

- reproduction steps
- expected result
- actual result
- screenshots if UI-related
- tx hash if transaction-related

## Priority Order

Run tests in this order:

1. launchpad creation flows
2. launchpad management / mint continuation
3. ERC-721 marketplace flows
4. ERC-1155 marketplace flows
5. cross-surface consistency checks

## Section A: Launchpad Creation

### A1. ERC-1155 Collection Create

Path:

- `/launchpad/nfteditions/create`

Checks:

- signed-out state renders clearly
- wallet-setup handoff preserves filled form values
- collection image upload works
- auto symbol suggestion works from collection name
- editing symbol manually is respected
- external link auto-fills from connected account when empty
- PIN step opens with the intended state
- successful deploy completes end-to-end
- progress dialog shows expected states
- `Deploy another` resets the form cleanly

Validate:

- deployed collection appears in portfolio after indexing
- if mint CTA is shown after success, it routes to the correct collection

### A2. ERC-1155 Mint Into Collection

Path:

- `/launchpad/nfteditions/[contract]/mint`

Checks:

- owner gating works correctly
- signed-out state is correct
- recipient auto-fills with connected wallet
- image upload is required and enforced
- token metadata pinning succeeds
- token ID validation blocks bad values
- quantity validation blocks zero/invalid values
- recipient validation blocks malformed addresses
- wallet-setup handoff preserves filled form values
- confirm dialog reflects token name, token ID, and quantity
- successful mint completes end-to-end
- `Mint another` resets cleanly and preserves recipient default

Validate:

- minted token appears on the collection and asset surfaces
- token metadata and image render correctly

### A3. Collection Drop Create

Path:

- `/launchpad/drop/create`

Checks:

- default start/end schedule is prefilled
- auto symbol suggestion works
- supply presets work
- custom supply input works
- free/paid toggle works
- switching back to `Free` clears stale paid-state inputs
- token selector opens, closes on outside click, closes on `Escape`
- price validation blocks invalid values
- end time must be after start time
- max per wallet validation works
- visibility toggle text is accurate
- wallet-setup handoff preserves filled form values
- success state offers correct reset behavior

Validate:

- resulting drop appears in launchpad after indexing
- if paid, price/token details match the intended setup

### A4. POP Event Create

Path:

- `/launchpad/pop/create`

Checks:

- default claim end window is prefilled
- event type selection works and updates guidance copy
- auto symbol suggestion works
- claim end validation blocks past times
- visibility toggle behavior is clear
- wallet-setup handoff preserves filled form values
- success reset restores defaults cleanly

Validate:

- resulting event appears correctly in launchpad or remains hidden when private

## Section B: Remix Flow (added 2026-04-30)

### B0. Remix — ERC-721 Origin, ERC-721 Target (Owner Self-Mint)

Path: `/create/remix/[721-contract]/[tokenId]`

Checks:
- collection selector shows all eligible collections with ERC-721/ERC-1155 badge
- ERC-721 collection selected — mint uses `createMintIntent` path
- IPFS metadata upload completes
- remix name auto-fills as `Remix of [original name]`
- parent attribution attributes embedded (`Parent Contract`, `Parent Token ID`)
- optional price field: if filled, listing is created after mint
- `confirmSelfRemix` backend call succeeds
- redirects to new remix asset page after success

### B1. Remix — ERC-721 Origin, ERC-1155 Target (Owner Self-Mint)

Path: `/create/remix/[721-contract]/[tokenId]`

Checks:
- ERC-1155 collection visible in collection selector with `ERC-1155` badge
- ERC-1155 collection selected — mint uses `mint_item` direct call (no registry poll)
- token ID generated from `Date.now()` and minted successfully
- listing created after mint with `tokenStandard: "ERC1155"` and `amount: "1"` when price set

### B2. Remix — Offer Flow (Non-Owner → Creator Approve)

Path: non-owner submits from `/create/remix/[contract]/[tokenId]`, creator approves in `/portfolio/remix-offers`

Checks:
- offer submitted and appears in creator portfolio
- creator `ApproveMintSheet` opens correctly
- collection selector shows correct collections including ERC-1155
- ERC-1155 collection: `mint_item` called directly; listing created with correct standard
- ERC-721 collection: `createMintIntent` used; listing created
- listing search uses `collection.standard` as `itemType` filter (not hardcoded `"ERC721"`)
- `confirmRemixOffer` backend call succeeds
- buyer sees "Complete Purchase" in portfolio

### B3. Remix — Cancel Bid Order (Regression Test)

Checks:
- user has an active bid order (offer placed, not yet accepted)
- cancel the bid from portfolio offers page
- backend receives `tokenStandard: "ERC721"` or `"ERC1155"` (never `"ERC20"`)
- cancel succeeds with 200

## Section C: Marketplace Core

### C1. ERC-721 Listing

Checks:

- list from asset page
- list from preview/modal surface if available
- cancel listing
- buy listing from secondary account
- listing state refreshes across surfaces after each action

Validate:

- correct marketplace contract is used
- success and error states are consistent

### C2. ERC-721 Offers

Checks:

- make offer from asset page
- make offer from preview surface if available
- accept offer as owner
- counter-offer flow if used in production path

Validate:

- dialogs use the correct token standard
- cache refreshes after offer lifecycle changes

### C3. ERC-1155 Listing

Checks:

- create listing with quantity
- buy a partial quantity
- buy remaining quantity if applicable
- cancel listing

Validate:

- quantity handling is correct
- UI reflects remaining listed quantity accurately

### C4. ERC-1155 Offers

Checks:

- make offer from asset page
- verify offer routes through ERC-1155 marketplace path
- accept offer as owner

Validate:

- no regression to ERC-721 routing
- order state refreshes correctly

### C5. Transfers

Checks:

- ERC-721 transfer
- ERC-1155 transfer
- transfer from both full asset page and any secondary surface where exposed

Validate:

- transfer flow respects token standard
- post-transfer ownership state updates correctly

## Section D: Cross-Surface Consistency

### D1. Asset Pages

Checks:

- standard asset page
- edition asset page
- drop asset page
- POP asset page if applicable

Validate:

- action panels show the correct controls for owner vs collector
- marketplace dialogs open with the correct asset data
- overview and side panels render expected metadata

### D2. Portfolio Surfaces

Checks:

- owned assets grid
- listings table
- offers table
- received offers table

Validate:

- state mutations from marketplace actions propagate into portfolio views

### D3. Preview Surfaces

Checks:

- asset preview dialog
- cards that expose list, offer, or buy actions

Validate:

- preview-driven actions use the same routing and success behavior as full pages

## Section E: Session and Wallet Continuity

Run these scenarios intentionally:

- fill a form before wallet setup, then complete setup
- open a transaction flow, cancel PIN, and retry
- let a session expire if practical, then retry a transaction
- switch accounts between owner and collector flows

Validate:

- pending intent is preserved where expected
- stale transaction state is not reused incorrectly
- dialogs close and reset cleanly

## Section E: Issue Severity

Use this severity model:

- `P0`: blocked transaction, wrong contract routing, loss of user intent, or irreversible wrong behavior
- `P1`: major workflow friction, broken state refresh, or misleading success/error handling
- `P2`: minor UX friction, copy confusion, or non-blocking visual inconsistency
- `P3`: polish-only issue

## Recommended Execution Rhythm

Suggested order for the team:

1. creator account runs Section A
2. collector account runs Section C buy/offer paths
3. both accounts verify Section E continuity cases
4. consolidate findings into a small fix list
5. ship only targeted fixes

## Exit Criteria

We can consider the current refactor phase ready to transition when:

- all launchpad creation flows complete successfully on live infra
- ERC-721 and ERC-1155 marketplace actions both validate end-to-end
- no wallet-setup continuity regressions remain
- no token-standard routing regressions remain
- remaining issues are mostly `P2` or `P3`
