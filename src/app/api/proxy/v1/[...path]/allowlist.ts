/**
 * Method/path allowlist for the /v1/* BFF proxy (route.ts). Pure logic,
 * split out so it's unit-testable without Next.js's route-export
 * restrictions (a route.ts file may only export recognized handlers).
 *
 * The proxy injects the server-only `MEDIALANE_API_KEY` into every outbound
 * request. The key is a fully-privileged tenant key — backend layered auth
 * (SIWS tokens, SNIP-12 signatures, on-chain ownership checks) handles the
 * real authorisation per route, but defense-in-depth at this boundary
 * limits the surface a leaked key or a future backend route addition can
 * reach through the io BFF.
 *
 * Scope rationale (audit `medialane-core/docs/audits/2026-05-25-medialane-io-bff-proxy-auth-audit.md`):
 *   - GET requests on /v1/* are ALL allowed — reads are public-equivalent
 *     and the audit confirmed there is no admin GET surface on /v1/.
 *     The previous per-resource GET enumeration caused a P0 incident
 *     (PR #44 → discover-page 403s for /v1/creators) when a new SDK
 *     method appeared without a matching pattern. Allowing all GETs
 *     prevents that entire class of incident. Postmortem #3 in the plan.
 *   - /v1/intents/* is scoped as a NAMESPACE, not enumerated per intent
 *     type. Every intent-creation route (listing, offer, counter-offer,
 *     fulfill, cancel, mint, create-collection, create-tier, checkout, …)
 *     is app-legitimate by construction — this IS the metered write API
 *     every app write goes through, and each route is independently
 *     authorized server-side. The prior per-verb enumeration was already
 *     missing `create-tier` (found 2026-08-05 auditing io against the
 *     medialane-starknet backend-bypass fix) — enumerating verbs here
 *     guarantees the next new intent type silently 403s until someone
 *     remembers a second, unrelated PR.
 *   - Every other write is an EXPLICIT enumeration. Any new mutating route
 *     outside the intents namespace requires a corresponding entry and an
 *     io PR.
 *
 * When adding a new mutating endpoint to the io app (outside /v1/intents/*),
 * add the (method, regex) pair below. Match against the path AFTER the
 * `/v1/` prefix.
 */
const ALLOWED_ROUTES: Record<string, RegExp[]> = {
  // ── Reads (all GET /v1/* allowed) ──────────────────────────────────────
  // Backend has no admin GET routes under /v1 — admin lives at /admin/* on
  // a separate API_SECRET_KEY gate. So a wildcard here is safe.
  GET: [/.+/],
  // ── Mutations ────────────────────────────────────────────────────────
  POST: [
    /^intents\/[a-z-]+$/,                                   // POST /v1/intents/<type> — see namespace rationale above
    /^intents\/[^/]+\/hydrate$/,                            // /v1/intents/:id/hydrate (tenant-scoped repair)
    /^auth\/siws\/(nonce|verify)$/,                         // SIWS sign-in (mirrors the dapp's proxy allowlist)
    /^auth\/email\/(request-code|verify-code)$/,            // email verification (wallet-onboarding)
    /^collections\/(register|sync-tx|claim)$/,             // launchpad create + create/collection + on-chain claim
    /^collections\/claim\/request$/,                       // manual-review claim request
    /^collection-slug-claims$/,                            // collection settings slug claim
    /^coins\/sync$/,                                       // creator coin launch → instant index
    /^drop\/conditions$/,                                  // launchpad drop/create (identity-gated on backend via SIWS)
    /^metadata\/(upload|upload-file)$/,                    // /v1/metadata/{upload,upload-file}
    /^remix-offers(\/(auto|self\/confirm|[^/]+\/(confirm|reject|extend)))?$/,  // remix offer lifecycle
    /^reports$/,                                           // /v1/reports (identity-gated on backend via SIWS)
    /^users\/(me|register)$/,                              // /v1/users/{me,register} — me also covers upsertMyWallet
    /^username-claims$/,                                   // /v1/username-claims
    /^wallet\/deploy$/,                                     // relayer-paid UDC deploy (new-signup bootstrap)
  ],
  PATCH: [
    /^intents\/[^/]+\/(confirm|signature)$/,               // /v1/intents/:id/{confirm,signature} — sign/confirm lifecycle for any intent
    /^collections\/[^/]+\/profile$/,                       // updateCollectionProfile (identity-gated on backend via SIWS)
    /^creators\/[^/]+\/profile$/,                          // updateCreatorProfile (identity-gated on backend via SIWS)
  ],
  // DELETE intentionally empty — no io flow deletes through the proxy.
};

export function isPathAllowed(method: string, path: string): boolean {
  const patterns = ALLOWED_ROUTES[method.toUpperCase()];
  if (!patterns) return false;
  return patterns.some((re) => re.test(path));
}
