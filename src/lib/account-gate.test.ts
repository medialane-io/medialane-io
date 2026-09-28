import { test, expect } from "bun:test";
import { UserFacingError } from "@medialane/ui";
import { requireAccount, requireSession, ACCOUNT_NOT_READY, SESSION_REQUIRED } from "./account-gate";

test("requireAccount refuses a missing address with copy a user can read", () => {
  expect(() => requireAccount(null)).toThrow(UserFacingError);
  expect(() => requireAccount("")).toThrow(ACCOUNT_NOT_READY);
  expect(() => requireAccount("0x1")).not.toThrow();
});

test("requireSession refuses a missing token with copy a user can read", () => {
  expect(() => requireSession(undefined)).toThrow(UserFacingError);
  expect(() => requireSession("")).toThrow(SESSION_REQUIRED);
  expect(() => requireSession("tok")).not.toThrow();
});
