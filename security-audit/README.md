# Security Audit: Passkey vs PIN Wallet Encryption

## What changed
This release improves the wallet UX so transfers and marketplace actions work for wallets created with either:
- Passkey (WebAuthn-derived encryption key)
- PIN (user-entered encryption key)

Because the app does not persist which encryption method was used at wallet-creation time, we added:
- Passkey unlocking as an alternative to entering a numeric PIN in dialogs that previously required a PIN.
- A passkey/PIN selector + migration fallback on the wallet transfer panel.

## Files changed
- `src/hooks/use-wallet-with-balance.ts`
  - Replaced the placeholder balance with Chipi SDK `useGetTokenBalance` (USDC on Starknet) and fixed strict SDK enum typings.
- `src/components/wallet/chipi-wallet-panel.tsx`
  - Removed the custom `/api/chipi/transfer` flow in favor of Chipi SDK `useTransfer`.
  - Added an “Auth method” selector (PIN vs passkey) and an “encryption mismatch” helper message.
  - Added a “Migrate PIN wallet to passkey” button using Chipi SDK `useMigrateWalletToPasskey`.
- `src/components/chipi/pin-dialog.tsx`
  - Added “Use passkey instead” so any operation requiring a PIN can be authorized via passkey-derived `encryptKey`.
- `src/components/chipi/session-setup-dialog.tsx`
  - Added “Use passkey instead” to enable fast signing sessions without forcing numeric PIN entry.

## What we did *not* change
- No Prisma schema changes.
- No backend encryption logic changes.
- No storage of “wallet was created with passkey vs PIN” in the database (keeps the existing privacy model).

## Risk assessment
### Client-side risks (encryption key handling)
- The derived passkey `encryptKey` must match the encryption key used when the wallet was created. If it does not, Chipi may fail decryption and/or execution.
- We do not log PINs or derived encryption keys. All handling is in-memory only.

### UX / failure-mode risks
- We added heuristics to detect “encryption/decrypt” failures and suggest switching auth method.
- Some error messages may not match the heuristics, so users might still need to manually switch between PIN and passkey.

### Session behavior
- Marketplace actions depend on a valid on-chain session key registration. `SessionSetupDialog` now supports passkey-derived authorization to register that session.

## Test plan (manual QA)
Run these checks in a staging environment with a fresh account (or using a test wallet) to avoid confusing results from cached passkey credentials.

### Wallet creation permutations
1. Create a wallet using passkey-first flow.
2. Create a wallet using PIN flow.

### Transfer tests (wallet panel + marketplace)
For each created wallet:
1. Passkey wallet:
   - Transfer from the wallet panel using “Use passkey”.
   - Transfer from the wallet panel using “Use PIN” should fail gracefully (and suggest switching).
   - Perform a marketplace action that previously triggered a PIN prompt (e.g., purchase/offer/listing that requires session activation).
   - Verify `SessionSetupDialog` can be completed via “Use passkey instead” without entering a numeric PIN.
2. PIN wallet:
   - Transfer from the wallet panel using “Use PIN”.
   - Switch the panel to “Use passkey” and verify behavior (should fail gracefully and suggest correct method).

### Migration tests
For a PIN-created wallet:
1. Click “Migrate PIN wallet to passkey”.
2. Confirm success.
3. Attempt a transfer again using “Use passkey”.
4. Verify the UI no longer requests PIN for subsequent operations where possible.

## Best practices for future releases
### Verification and regression
- Keep TypeScript strictness on SDK enum values (`Chain`, `ChainToken`) to prevent runtime mismatches.
- Add UI-level telemetry only for non-sensitive error categories (do not log derived keys).
- Treat passkey flows as first-class and ensure every PIN-requiring dialog has a passkey alternative.

### Documentation
- Document the intended UX for encryption mismatch and migration under the “Wallet” section.
- Add a short “Security model” note: we never store PINs; passkeys are stored by the browser platform.

### Suggested automated tests (next)
If you later add CI automation, consider:
- Playwright tests for passkey availability fallback UI.
- “Session activation” regression tests for both auth methods.
- Snapshot tests for the wallet panel mismatch helper rendering.

## Where to start if something breaks
1. Confirm the failing dialog path:
   - Wallet panel (`chipi-wallet-panel.tsx`)
   - PIN-required actions (`pin-dialog.tsx`)
   - Session activation (`session-setup-dialog.tsx`)
2. Ask user to switch auth method in UI (PIN vs passkey) and retry once.
3. If mismatch persists, try migration (PIN -> passkey) for PIN wallets.

