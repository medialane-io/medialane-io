import { test, expect } from "bun:test";

const SINGLE_EMAIL = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/;
const isSingleEmailAddress = (v: string) => v.length <= 254 && SINGLE_EMAIL.test(v);

test("accepts an ordinary address", () => {
  expect(isSingleEmailAddress("alice@example.com")).toBe(true);
});

test("rejects a recipient list, which nodemailer would fan out to", () => {
  expect(isSingleEmailAddress("alice@example.com, bob@example.com")).toBe(false);
  expect(isSingleEmailAddress("alice@example.com; bob@example.com")).toBe(false);
});

test("rejects display-name forms that can smuggle a second recipient", () => {
  expect(isSingleEmailAddress("Alice <alice@example.com>")).toBe(false);
});

test("rejects header-injection attempts", () => {
  expect(isSingleEmailAddress("alice@example.com\nBcc: bob@example.com")).toBe(false);
  expect(isSingleEmailAddress("alice@example.com\r\nBcc: bob@example.com")).toBe(false);
});

test("rejects absurdly long input", () => {
  expect(isSingleEmailAddress("a".repeat(250) + "@example.com")).toBe(false);
});
