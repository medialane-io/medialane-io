import { test, expect } from "bun:test";
import { resolveConfig } from "@medialane/sdk";
import { resolveRpcUrl } from "./starknet";

const BACKEND = "https://api.medialane.io";

test("the browser branch is absolute, because the SDK schema rejects a relative rpcUrl", () => {
  const url = resolveRpcUrl("https://app.test", BACKEND);
  expect(url).toBe("https://app.test/api/rpc");
  expect(() => new URL(url)).not.toThrow();
});

test("the server branch points at the metered backend endpoint", () => {
  expect(resolveRpcUrl(undefined, BACKEND)).toBe("https://api.medialane.io/v1/rpc");
});

test("a trailing slash on the backend url does not produce a double slash", () => {
  expect(resolveRpcUrl(undefined, "https://api.medialane.io/")).toBe("https://api.medialane.io/v1/rpc");
});

test("neither branch ever yields a relative path", () => {
  for (const url of [resolveRpcUrl("https://app.test", BACKEND), resolveRpcUrl(undefined, BACKEND)]) {
    expect(url.startsWith("/")).toBe(false);
  }
});

test("the SDK schema accepts what the browser branch produces", () => {
  expect(() =>
    resolveConfig({
      rpcUrl: resolveRpcUrl("https://app.test", BACKEND),
      backendUrl: BACKEND,
      chain: "STARKNET",
    }),
  ).not.toThrow();
});

test("the SDK schema rejects a relative rpcUrl, which is what broke production", () => {
  expect(() =>
    resolveConfig({ rpcUrl: "/api/rpc", backendUrl: BACKEND, chain: "STARKNET" }),
  ).toThrow();
});
