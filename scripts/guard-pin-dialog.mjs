#!/usr/bin/env node
/**
 * Regression guard: a wallet is sealed by a PIN OR a passkey, so any surface
 * that renders <PinDialog> must also be passkey-aware — otherwise it silently
 * locks out passkey users (the "Malformed UTF-8 data" bug, 2026-06-17).
 *
 * Fails if a file renders <PinDialog> without referencing one of the
 * passkey-aware unlock primitives below. Run: node scripts/guard-pin-dialog.mjs
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ALLOWED = [
  "pinDialogProps",          // from useWalletUnlock / useWriteAction (renders PinDialog for us)
  "useWalletUnlock",
  "useWriteAction",
  "useWalletAuthMethod",
  "useMarketplaceActionFlow",
  "usesPasskey",
  "usePasskeyAuth",
  "usePinMigration",          // wallet panel migration flow
  "PinDialogSubmitOptions",   // passkey-threaded wallet transfer handlers
  // Prop-based: presentational components fed by a passkey-aware parent hook.
  "handleCancelPin",          // <- useOrderActions (useWalletUnlock under the hood)
  "cancelPinOpen",
  "authMethod",               // <- useChipiWalletPanel (passes passkey/pin handlers down)
  "handlePinMigrationSubmit",
  "handleSessionUnlockAndSend",
];

const EXEMPT = [
  "src/components/chipi/pin-dialog.tsx", // the component definition itself
];

const hits = execSync('grep -rl "<PinDialog" src --include="*.tsx" || true', { encoding: "utf8" })
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean)
  .filter((f) => !EXEMPT.includes(f));

const offenders = hits.filter((f) => {
  const src = readFileSync(f, "utf8");
  return !ALLOWED.some((tok) => src.includes(tok));
});

if (offenders.length) {
  console.error("✗ <PinDialog> rendered without a passkey-aware unlock primitive:");
  for (const f of offenders) console.error("  - " + f);
  console.error("\nEvery PIN entry must come from useWalletUnlock/useWriteAction (pinDialogProps)");
  console.error("or be explicitly passkey-aware. A PIN-only flow locks out passkey users.");
  process.exit(1);
}

console.log(`✓ guard-pin-dialog: ${hits.length} <PinDialog> sites, all passkey-aware.`);
