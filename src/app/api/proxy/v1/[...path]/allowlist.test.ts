import { test, expect } from "bun:test";
import { isPathAllowed } from "./allowlist";

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

test("POST /v1/wallet/deploy is no longer allowed (removed — see AVNU-sponsored deploy)", () => {
  expect(isPathAllowed("POST", "wallet/deploy")).toBe(false);
});

test("POST /v1/auth/email/request-code and /verify-code are allowed", () => {
  expect(isPathAllowed("POST", "auth/email/request-code")).toBe(true);
  expect(isPathAllowed("POST", "auth/email/verify-code")).toBe(true);
});

test("POST /v1/auth/email/something-else is rejected", () => {
  expect(isPathAllowed("POST", "auth/email/something-else")).toBe(false);
});

test("POST /v1/auth/email/register-account is allowed", () => {
  expect(isPathAllowed("POST", "auth/email/register-account")).toBe(true);
});

test("POST /v1/users/me/generate-wallet is allowed", () => {
  expect(isPathAllowed("POST", "users/me/generate-wallet")).toBe(true);
});
