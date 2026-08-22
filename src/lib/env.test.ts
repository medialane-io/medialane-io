import { test, expect } from "bun:test";
import { isHttpUrl, readUrlEnv } from "@/lib/env";

test("a bare API key is not accepted as a URL", () => {
  expect(isHttpUrl("not-a-url-just-a-key")).toBe(false);
});

test("an https endpoint is accepted", () => {
  expect(isHttpUrl("https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/key")).toBe(true);
});

test("undefined and empty are not URLs", () => {
  expect(isHttpUrl(undefined)).toBe(false);
  expect(isHttpUrl("")).toBe(false);
});

test("a non-http protocol is rejected", () => {
  expect(isHttpUrl("file:///etc/passwd")).toBe(false);
});

test("readUrlEnv skips a key-shaped candidate and takes the first real URL", () => {
  expect(readUrlEnv("not-a-url-just-a-key", "https://rpc.example/v1")).toBe("https://rpc.example/v1");
});

test("readUrlEnv honours candidate order when several are URLs", () => {
  expect(readUrlEnv("https://first.example", "https://second.example")).toBe("https://first.example");
});

test("readUrlEnv returns an empty string when nothing is a URL", () => {
  expect(readUrlEnv(undefined, "", "not-a-url")).toBe("");
});
