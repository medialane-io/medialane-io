import { test, expect } from "bun:test";
import { isPathAllowed } from "./allowlist";

// Every /v1/intents/<type> creation route medialane-backend exposes must be
// reachable through the proxy. Found 2026-08-05 auditing io against the
// medialane-starknet backend-bypass fix: the prior per-verb enumeration was
// already missing "create-tier" (needed for ip-tickets/ip-club tier creation)
// even though listing/offer/etc. were present — the exact class of drift the
// starknet proxy hit in production a day earlier.
const INTENT_TYPES = [
  "mint", "create-collection", "create-tier",
  "listing", "offer", "cancel", "fulfill", "checkout", "counter-offer",
];

test("POST /v1/intents/<type> is allowed for every known intent type", () => {
  for (const type of INTENT_TYPES) {
    expect(isPathAllowed("POST", `intents/${type}`)).toBe(true);
  }
});

test("POST /v1/intents/<type> is allowed for a hypothetical future intent type", () => {
  expect(isPathAllowed("POST", "intents/some-future-type")).toBe(true);
});

test("POST /v1/intents/:id/hydrate is allowed for any intent id", () => {
  expect(isPathAllowed("POST", "intents/abc-123/hydrate")).toBe(true);
});

test("PATCH /v1/intents/:id/signature and /confirm are allowed for any intent id", () => {
  expect(isPathAllowed("PATCH", "intents/abc-123/signature")).toBe(true);
  expect(isPathAllowed("PATCH", "intents/abc-123/confirm")).toBe(true);
});

test("GET /v1/intents/:id is allowed (GET /v1/* is allow-all)", () => {
  expect(isPathAllowed("GET", "intents/abc-123")).toBe(true);
});

test("POST /v1/intents/<type> with extra path segments (other than /hydrate) is rejected", () => {
  expect(isPathAllowed("POST", "intents/listing/extra")).toBe(false);
});

test("unrelated POST routes are still rejected", () => {
  expect(isPathAllowed("POST", "admin/accounts/1/credits/grant")).toBe(false);
});

test("POST /v1/wallet/deploy is allowed (new-signup bootstrap)", () => {
  expect(isPathAllowed("POST", "wallet/deploy")).toBe(true);
});

test("POST /v1/auth/email/request-code and /verify-code are allowed", () => {
  expect(isPathAllowed("POST", "auth/email/request-code")).toBe(true);
  expect(isPathAllowed("POST", "auth/email/verify-code")).toBe(true);
});

test("POST /v1/auth/email/something-else is rejected", () => {
  expect(isPathAllowed("POST", "auth/email/something-else")).toBe(false);
});
