
const ALLOWED_ROUTES: Record<string, RegExp[]> = {

  // Explicit allowlist — every path here is a public/self-scoped read the io
  // app actually calls through @medialane/sdk's MedialaneClient. Anything not
  // listed (e.g. /v1/portal/*, /v1/business/provisioning) is internal/admin
  // data and must stay unreachable from this public proxy.
  GET: [
    /^orders$/,
    /^orders\/[^/]+$/,
    /^orders\/token\/[^/]+\/[^/]+$/,
    /^orders\/user\/[^/]+$/,
    /^orders\/received\/[^/]+$/,
    /^orders\/counter-offers$/,
    /^tokens$/,
    /^tokens\/owned\/[^/]+$/,
    /^tokens\/[^/]+\/[^/]+$/,
    /^tokens\/[^/]+\/[^/]+\/(history|comments|remixes)$/,
    /^collections$/,
    /^collections\/[^/]+$/,
    /^collections\/[^/]+\/tokens$/,
    /^collections\/[^/]+\/gated-content$/,
    /^activities$/,
    /^activities\/[^/]+$/,
    /^search$/,
    /^intents\/[^/]+$/,
    /^metadata\/(signed-url|resolve)$/,
    /^wallet-activity$/,
    /^creators$/,
    /^creators\/[^/]+\/profile$/,
    /^creators\/by-username\/[^/]+$/,
    /^collection-slug-claims\/check\/[^/]+$/,
    /^collection-slug-claims\/me$/,
    /^users\/me$/,
    /^auth\/email\/exists$/,
    /^pop\/eligibility\/[^/]+(\/[^/]+)?$/,
    /^coins$/,
    /^coins\/prices$/,
    /^coins\/claims$/,
    /^coins\/[^/]+$/,
    /^drop\/mint-status\/[^/]+\/[^/]+$/,
    /^drop\/[^/]+\/(info|state)$/,
    /^rewards$/,
    /^rewards\/config$/,
    /^rewards\/batch$/,
    /^rewards\/[^/]+$/,
    /^rewards\/[^/]+\/events$/,
    /^club\/[^/]+\/[^/]+$/,
    /^club\/[^/]+\/[^/]+\/member\/[^/]+$/,
    /^tickets\/[^/]+\/[^/]+$/,
    /^tickets\/[^/]+\/count$/,
    /^ipnft\/[^/]+\/[^/]+$/,
    /^username-claims\/me$/,
    /^username-claims\/check\/[^/]+$/,
    /^stats$/,
    /^prices$/,
    /^remix-offers$/,
    /^remix-offers\/[^/]+$/,
    /^sponsorship\/offers$/,
    /^sponsorship\/offers\/[^/]+$/,
    /^sponsorship\/offers\/[^/]+\/bids$/,
    /^sponsorship\/proposals$/,
    /^sponsorship\/proposals\/[^/]+$/,
    /^sponsorship\/licenses$/,
    /^sponsorship\/licenses\/[^/]+$/,
  ],

  POST: [
    /^intents\/[a-z-]+$/,
    /^intents\/[^/]+\/hydrate$/,
    /^auth\/siws\/(nonce|verify)$/,
    /^auth\/email\/(request-code|verify-code|register-account)$/,
    /^collections\/(register|sync-tx|claim)$/,
    /^collections\/claim\/request$/,
    /^collection-slug-claims$/,
    /^coins\/sync$/,
    /^drop\/conditions$/,
    /^metadata\/(upload|upload-file)$/,
    /^remix-offers(\/(auto|self\/confirm|[^/]+\/(confirm|reject|extend)))?$/,
    /^reports$/,
    /^users\/(me|register)$/,
    /^users\/me\/(generate-wallet|email)$/,
    /^username-claims$/,
  ],
  PATCH: [
    /^intents\/[^/]+\/(confirm|signature)$/,
    /^collections\/[^/]+\/profile$/,
    /^creators\/[^/]+\/profile$/,
  ],

};

export function isPathAllowed(method: string, path: string): boolean {
  const patterns = ALLOWED_ROUTES[method.toUpperCase()];
  if (!patterns) return false;
  return patterns.some((re) => re.test(path));
}
