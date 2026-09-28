import { test, expect } from "bun:test";
import { friendlyErrorMessage, friendlyWriteError } from "./friendly-error";

test("passes through a genuinely user-facing message unchanged", () => {
  expect(friendlyErrorMessage(new Error("Incorrect code"))).toBe("Incorrect code");
  expect(friendlyErrorMessage(new Error("That email is already in use on another account.")))
    .toBe("That email is already in use on another account.");
});

test("falls back for a raw proxy/route error naming an internal path", () => {
  const err = new Error("Path not allowed through io proxy: POST /v1/users/me/email");
  expect(friendlyErrorMessage(err)).toBe("Something went wrong. Please try again.");
});

test("falls back for a message naming a server env var", () => {
  const err = new Error("MEDIALANE_API_KEY is not configured on the server");
  expect(friendlyErrorMessage(err)).toBe("Something went wrong. Please try again.");
});

test("falls back for a URL, a stack frame, or a WebAuthn/DOMException message", () => {
  expect(friendlyErrorMessage(new Error("fetch failed: https://backend.internal/v1/x")))
    .toBe("Something went wrong. Please try again.");
  expect(friendlyErrorMessage(new Error("at Object.<anonymous> (/app/foo.js:12:5)")))
    .toBe("Something went wrong. Please try again.");
  expect(friendlyErrorMessage(new Error("DOMException: The operation is not allowed")))
    .toBe("Something went wrong. Please try again.");
});

test("falls back for an overly long message", () => {
  const err = new Error("x".repeat(161));
  expect(friendlyErrorMessage(err)).toBe("Something went wrong. Please try again.");
});

test("does not false-positive on ordinary copy containing the word 'at'", () => {
  expect(friendlyErrorMessage(new Error("You're already at your listing limit for this collection")))
    .toBe("You're already at your listing limit for this collection");
});

test("uses the provided fallback text", () => {
  const err = new Error("Path not allowed through io proxy: POST /v1/users/me/email");
  expect(friendlyErrorMessage(err, "Couldn't save your email. Please try again.")).toBe(
    "Couldn't save your email. Please try again.",
  );
});

test("friendlyWriteError turns a bare wallet failure into settled copy", () => {
  expect(friendlyWriteError(new Error("execute failed"), "Purchase failed")).toBe(
    "Request not completed. Nothing was submitted.",
  );
  expect(friendlyWriteError(new Error("User rejected request"), "Purchase failed")).toBe(
    "Request not completed. Nothing was submitted.",
  );
});

test("friendlyWriteError still passes backend-authored copy through", () => {
  expect(friendlyWriteError(new Error("You're already at your listing limit for this collection")))
    .toBe("You're already at your listing limit for this collection");
});

test("friendlyWriteError keeps the caller fallback for technical noise", () => {
  const err = new Error("MEDIALANE_API_KEY is not configured on the server");
  expect(friendlyWriteError(err, "Transfer failed")).toBe("Transfer failed");
});
