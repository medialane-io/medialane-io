import { test, expect } from "bun:test";

function resolveGateway(configured: string | undefined): string | null {
  const v = configured?.trim();
  if (!v) return null;
  const withScheme = v.startsWith("http") ? v : `https://${v}`;
  return withScheme.endsWith("/") ? `${withScheme}ipfs/` : `${withScheme}/ipfs/`;
}

test("no configuration leaves the public gateway in place", () => {
  expect(resolveGateway(undefined)).toBeNull();
  expect(resolveGateway("")).toBeNull();
  expect(resolveGateway("   ")).toBeNull();
});

test("a bare hostname becomes a full ipfs path", () => {
  expect(resolveGateway("medialane.mypinata.cloud")).toBe("https://medialane.mypinata.cloud/ipfs/");
});

test("a hostname with a scheme is accepted unchanged", () => {
  expect(resolveGateway("https://medialane.mypinata.cloud")).toBe("https://medialane.mypinata.cloud/ipfs/");
});

test("a trailing slash does not produce a double slash", () => {
  expect(resolveGateway("https://medialane.mypinata.cloud/")).toBe("https://medialane.mypinata.cloud/ipfs/");
});

test("surrounding whitespace in the env var is tolerated", () => {
  expect(resolveGateway("  medialane.mypinata.cloud  ")).toBe("https://medialane.mypinata.cloud/ipfs/");
});

test("the resolved value ends in the prefix the URL builder expects to match", () => {
  const g = resolveGateway("medialane.mypinata.cloud")!;
  const url = `${g}bafyexample`;
  expect(url.startsWith(g)).toBe(true);
  expect(g.endsWith("/ipfs/")).toBe(true);
});
