import type { Call } from "starknet";
import {
  executeSponsored as sdkExecuteSponsored,
  type TypedDataSigner,
  type SponsoredExecuteResult,
} from "@medialane/sdk/starknet";

export { SponsoredCallRejectedError, type TypedDataSigner, type SponsoredExecuteResult } from "@medialane/sdk/starknet";

// Thin, io-local pass-through — injects this app's own paymaster proxy URL
// into the SDK's wallet-agnostic executeSponsored(). No sponsorship logic
// lives here; this file exists only so tests can mock a small, app-local
// module instead of `@medialane/sdk/starknet` directly (mock.module isn't
// file-scoped in bun test — mocking the shared SDK module leaks across
// test files in the same run and breaks sibling tests that import it for
// real, e.g. guardian.test.ts).
const PROXY_URL = "/api/wallet/sponsored-invoke";

export function executeSponsored(signer: TypedDataSigner, calls: Call[]): Promise<SponsoredExecuteResult> {
  return sdkExecuteSponsored({ proxyUrl: PROXY_URL }, signer, calls);
}
