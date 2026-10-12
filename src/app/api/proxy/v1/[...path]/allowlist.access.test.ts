import { expect, test } from "bun:test";
import { isPublicAppRoute } from "@medialane/sdk";

const A = "0x" + "a".repeat(64);

const VISITOR_CALLS: Array<[string, string]> = [
  ["GET", "collections"], ["GET", `collections/${A}`], ["GET", `collections/${A}/tokens`], ["GET", `collections/${A}/profile`],
  ["GET", `tokens/${A}/1`], ["GET", `tokens/${A}/1/history`], ["GET", `tokens/${A}/1/comments`], ["GET", `tokens/${A}/1/remixes`],
  ["GET", `tokens/owned/${A}`], ["GET", "orders"], ["GET", `orders/token/${A}/1`], ["GET", "activities"], ["GET", `activities/${A}`],
  ["GET", "search"], ["GET", "creators"], ["GET", `creators/${A}/profile`], ["GET", "creators/by-username/ana"],
  ["GET", "coins"], ["GET", `coins/${A}`], ["GET", `coins/${A}/guarantees`], ["GET", "coins/prices"],
  ["GET", "drops"], ["GET", `drops/${A}`], ["GET", `drops/${A}/state`], ["GET", `pop/${A}/claim-info`], ["GET", `ipnft/${A}/1`],
  ["GET", "rewards/config"], ["GET", "stats"], ["GET", "prices"], ["GET", "sponsorship/offers"],
  ["GET", "auth/email/exists"], ["POST", "auth/email/register-account"], ["POST", "auth/email/request-code"],
  ["POST", "auth/email/verify-code"], ["POST", "auth/email/confirm"],
];

test("every call a visitor's page makes is public", () => {
  for (const [method, path] of VISITOR_CALLS) expect([method, path, isPublicAppRoute(method, path)]).toEqual([method, path, true]);
});

test("uploads, intents, chain calls and swap quotes need an account", () => {
  for (const [method, path] of [["POST", "metadata/upload-file"], ["POST", "intents/listing"], ["POST", "rpc"], ["POST", "swap/quote"], ["POST", "tx/sync"]]) {
    expect(isPublicAppRoute(method, path)).toBe(false);
  }
});
