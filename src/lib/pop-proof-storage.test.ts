import { describe, expect, test } from "bun:test";
import { claimProofFor } from "./pop-proof-storage";

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
  };
}

describe("the claim proof survives a sign-in round trip", () => {
  test("a proof in the link is used and remembered for this collection", () => {
    const storage = memoryStorage();
    expect(claimProofFor(storage, "0xabc", "#pop-proof=0x1,0x2")).toEqual(["0x1", "0x2"]);
    expect(claimProofFor(storage, "0xabc", "")).toEqual(["0x1", "0x2"]);
  });

  test("an empty proof (a one-address list) is remembered too", () => {
    const storage = memoryStorage();
    expect(claimProofFor(storage, "0xabc", "#pop-proof=")).toEqual([]);
    expect(claimProofFor(storage, "0xabc", "")).toEqual([]);
  });

  test("a proof remembered for one collection is not used for another", () => {
    const storage = memoryStorage();
    claimProofFor(storage, "0xabc", "#pop-proof=0x1");
    expect(claimProofFor(storage, "0xdef", "")).toBeNull();
  });

  test("a newer link replaces the remembered proof", () => {
    const storage = memoryStorage();
    claimProofFor(storage, "0xabc", "#pop-proof=0x1");
    expect(claimProofFor(storage, "0xabc", "#pop-proof=0x2")).toEqual(["0x2"]);
    expect(claimProofFor(storage, "0xabc", "")).toEqual(["0x2"]);
  });

  test("without storage it still reads the link", () => {
    expect(claimProofFor(null, "0xabc", "#pop-proof=0x1")).toEqual(["0x1"]);
  });
});
