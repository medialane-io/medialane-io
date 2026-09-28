import { isUserRejectedRequest } from "@medialane/ui";

const TECHNICAL_PATTERN =
  /https?:\/\/|DOMException|webauthn|\bat \S+:\d+:\d+|\(\S+:\d+:\d+\)|\/v\d+\/|\b(GET|POST|PUT|PATCH|DELETE)\s+\/\S+/i;
const ENV_VAR_PATTERN = /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/;

const NOT_SUBMITTED = "Request not completed. Nothing was submitted.";

export function friendlyErrorMessage(
  e: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = e instanceof Error ? e.message : String(e);
  if (TECHNICAL_PATTERN.test(message) || ENV_VAR_PATTERN.test(message) || message.length > 160) {
    return fallback;
  }
  return message;
}

export function friendlyWriteError(e: unknown, fallback?: string): string {
  if (isUserRejectedRequest(e)) return NOT_SUBMITTED;
  return friendlyErrorMessage(e, fallback);
}
