/**
 * Never show a user a raw browser/RPC error (DOMException spec links, http(s)://
 * URLs, stack-shaped text). App-authored messages (already written in plain
 * language, e.g. "No route found for this pair.") pass through unchanged.
 */
const TECHNICAL_PATTERN = /https?:\/\/|DOMException|webauthn|\bat \S+:\d+:\d+/i;

export function friendlyErrorMessage(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  if (TECHNICAL_PATTERN.test(message) || message.length > 160) {
    return "Something went wrong. Please try again.";
  }
  return message;
}
