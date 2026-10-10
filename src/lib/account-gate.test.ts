import { test, expect } from "bun:test";
import { UserFacingError } from "@medialane/ui";
import { requireAccount, requireSignedIn, ACCOUNT_NOT_READY, SESSION_REQUIRED } from "./account-gate";

test("requireAccount refuses a missing address with copy a user can read", () => {
  expect(() => requireAccount(null)).toThrow(UserFacingError);
  expect(() => requireAccount("")).toThrow(ACCOUNT_NOT_READY);
  expect(() => requireAccount("0x1")).not.toThrow();
});

test("requireSignedIn refuses a missing session with copy a user can read", () => {
  expect(() => requireSignedIn(undefined)).toThrow(UserFacingError);
  expect(() => requireSignedIn(null)).toThrow(SESSION_REQUIRED);
  expect(() => requireSignedIn({ accountId: "acc_1" })).not.toThrow();
});
