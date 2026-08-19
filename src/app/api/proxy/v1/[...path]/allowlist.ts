
const ALLOWED_ROUTES: Record<string, RegExp[]> = {

  GET: [/.+/],

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
