import { test, expect } from "bun:test";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  shouldSetSessionCookie,
  extractAccountToken,
  stripAccountToken,
} from "./session-cookie";

test("SESSION_COOKIE_NAME and SESSION_COOKIE_MAX_AGE_SECONDS are the expected constants", () => {
  expect(SESSION_COOKIE_NAME).toBe("ml_account_session");
  expect(SESSION_COOKIE_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
});

test("shouldSetSessionCookie is true for register-account and verify-code POSTs", () => {
  expect(shouldSetSessionCookie("auth/email/register-account", "POST")).toBe(true);
  expect(shouldSetSessionCookie("auth/email/verify-code", "POST")).toBe(true);
});

test("shouldSetSessionCookie is false for anything else", () => {
  expect(shouldSetSessionCookie("auth/email/request-code", "POST")).toBe(false);
  expect(shouldSetSessionCookie("auth/email/register-account", "GET")).toBe(false);
  expect(shouldSetSessionCookie("users/me", "POST")).toBe(false);
});

test("extractAccountToken reads a string accountToken field", () => {
  expect(extractAccountToken(JSON.stringify({ accountToken: "account_session_abc.def" }))).toBe(
    "account_session_abc.def",
  );
});

test("extractAccountToken returns null when the field is missing, non-string, or the body isn't JSON", () => {
  expect(extractAccountToken(JSON.stringify({ token: "x" }))).toBeNull();
  expect(extractAccountToken(JSON.stringify({ accountToken: 123 }))).toBeNull();
  expect(extractAccountToken("not json")).toBeNull();
});

test("stripAccountToken removes only the accountToken field, keeping the rest of the body intact", () => {
  const body = JSON.stringify({ token: "email_verified_abc.def", accountToken: "account_session_abc.def" });
  const stripped = JSON.parse(stripAccountToken(body));
  expect(stripped).toEqual({ token: "email_verified_abc.def" });
});

test("stripAccountToken is a no-op when there's no accountToken field, or the body isn't JSON", () => {
  const body = JSON.stringify({ token: "email_verified_abc.def" });
  expect(JSON.parse(stripAccountToken(body))).toEqual({ token: "email_verified_abc.def" });
  expect(stripAccountToken("not json")).toBe("not json");
});





test("a wallet sign-in establishes the session, the same as an email code", () => {
  expect(shouldSetSessionCookie("auth/siws/verify", "POST")).toBe(true);
  expect(shouldSetSessionCookie("auth/email/verify-code", "POST")).toBe(true);
  expect(shouldSetSessionCookie("auth/email/register-account", "POST")).toBe(true);
});

test("nothing else sets it", () => {
  expect(shouldSetSessionCookie("auth/siws/nonce", "POST")).toBe(false);
  expect(shouldSetSessionCookie("auth/siws/verify", "GET")).toBe(false);
  expect(shouldSetSessionCookie("tokens", "POST")).toBe(false);
});
