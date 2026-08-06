import { test, expect, beforeEach } from "bun:test";
import type { SealedOwner } from "./passkey";

// bun test's runtime has no DOM: `window` and `localStorage` are both
// undefined globals (unlike a browser, where `window` is the global object
// itself). store.ts's SSR guard (`typeof window === "undefined"`) needs
// `window` to resolve to something truthy for the browser code paths under
// test to run at all; `dispatchEvent`/`addEventListener`/`Event` are already
// implemented on bun's `globalThis`, so aliasing `window` to `globalThis`
// is enough — only `localStorage` needs an actual in-memory shim.
if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  (globalThis as { window: unknown }).window = globalThis;
}
if (typeof (globalThis as { localStorage?: unknown }).localStorage === "undefined") {
  const memory = new Map<string, string>();
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, value),
    removeItem: (key: string) => void memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() { return memory.size; },
  };
}

const {
  loadSealedOwner, loadWalletAddress, saveSealedOwner, clearSealedOwner,
} = await import("./store");

const FAKE: SealedOwner = {
  credentialId: "cred1", ownerPubKey: "0xabc", address: "0xdef", iv: "iv1", ciphertext: "ct1",
};

beforeEach(() => {
  localStorage.clear();
});

test("loadSealedOwner returns null when nothing stored", () => {
  expect(loadSealedOwner()).toBeNull();
});

test("saveSealedOwner then loadSealedOwner round-trips", () => {
  saveSealedOwner(FAKE);
  expect(loadSealedOwner()).toEqual(FAKE);
});

test("loadWalletAddress reads the address field", () => {
  saveSealedOwner(FAKE);
  expect(loadWalletAddress()).toBe("0xdef");
});

test("clearSealedOwner removes it", () => {
  saveSealedOwner(FAKE);
  clearSealedOwner();
  expect(loadSealedOwner()).toBeNull();
});
