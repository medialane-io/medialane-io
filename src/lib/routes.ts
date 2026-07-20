// Chain-scoped URL routing helpers — single source is @medialane/sdk.
// Do not reimplement here; this file exists only so the ~49 existing
// `from "@/lib/routes"` call sites don't need to change.
export { SUPPORTED_URL_CHAINS, chainSlug, chainFromSlug, assetHref, collectionHref, coinHref } from "@medialane/sdk";
