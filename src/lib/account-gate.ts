import { UserFacingError } from "@medialane/ui";

export const ACCOUNT_NOT_READY = "Account not ready. Please refresh and try again.";
export const ACCOUNT_STILL_LOADING = "Account not ready. Please wait a moment.";
export const SESSION_REQUIRED = "Secure your account first";

export function requireAccount<T>(value: T | null | undefined): asserts value is T {
  if (!value) throw new UserFacingError(ACCOUNT_NOT_READY);
}

export function requireSession(token: string | null | undefined): asserts token is string {
  if (!token) throw new UserFacingError(SESSION_REQUIRED);
}
