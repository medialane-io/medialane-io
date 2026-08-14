
const TECHNICAL_PATTERN = /https?:\/\/|DOMException|webauthn|\bat \S+:\d+:\d+/i;

export function friendlyErrorMessage(
  e: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = e instanceof Error ? e.message : String(e);
  if (TECHNICAL_PATTERN.test(message) || message.length > 160) {
    return fallback;
  }
  return message;
}
