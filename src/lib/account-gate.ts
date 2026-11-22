import { UserFacingError } from "@medialane/ui";

export const ACCOUNT_NOT_READY = "Refresh to continue.";
export const SESSION_REQUIRED = "Secure your account first";

export function requireAccount<T>(value: T | null | undefined): asserts value is T {
  if (!value) throw new UserFacingError(ACCOUNT_NOT_READY);
}

export function requireSignedIn<T>(session: T | null | undefined): asserts session is T {
  if (!session) throw new UserFacingError(SESSION_REQUIRED);
}
