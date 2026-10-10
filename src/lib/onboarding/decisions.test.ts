import { describe, expect, test } from "bun:test";
import { afterCodeVerified, afterEmailCheck, afterRegister, isEmailAddress } from "./decisions";

const WALLET = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";

describe("after the email is checked", () => {
  test("an address that already has an account is sent a login code", () => {
    expect(afterEmailCheck(true)).toBe("send-code");
  });

  test("a new address is registered", () => {
    expect(afterEmailCheck(false)).toBe("register");
  });
});

describe("after registering", () => {
  test("a freshly created account goes straight to creating its wallet", () => {
    expect(afterRegister("created")).toBe("wallet-setup");
  });

  test("an address that turns out to exist already signs in with a code instead", () => {
    expect(afterRegister("already-exists")).toBe("send-code");
  });
});

describe("after the login code is verified", () => {
  test("a new account has no wallet yet: create it (a new io user)", () => {
    expect(afterCodeVerified(null, null)).toEqual({ type: "wallet-setup" });
  });

  test("an account that exists but never got a wallet: create it (the retry after a failed first try)", () => {
    expect(afterCodeVerified(null, null)).toEqual({ type: "wallet-setup" });
  });

  test("a returning user whose wallet already has their key on this browser is finished (a returning io user)", () => {
    expect(afterCodeVerified({ walletAddress: WALLET, needsKeySetup: false }, WALLET)).toEqual({ type: "finish" });
  });

  test("the same wallet written differently on this browser still counts as this browser's key", () => {
    const padded = "0x" + WALLET.slice(2).toUpperCase();
    expect(afterCodeVerified({ walletAddress: WALLET, needsKeySetup: false }, padded)).toEqual({ type: "finish" });
  });

  test("a returning user on a browser without their key is sent to link this device (a new browser)", () => {
    expect(afterCodeVerified({ walletAddress: WALLET, needsKeySetup: false }, null)).toEqual({
      type: "link-device",
      walletAddress: WALLET,
    });
  });

  test("a browser holding a key for a different wallet is also sent to link this device", () => {
    expect(afterCodeVerified({ walletAddress: WALLET, needsKeySetup: false }, "0x1234")).toEqual({
      type: "link-device",
      walletAddress: WALLET,
    });
  });

  test("a wallet that still has the platform's provisioning key needs the user's own key first (a provisioned user)", () => {
    expect(afterCodeVerified({ walletAddress: WALLET, needsKeySetup: true }, null)).toEqual({
      type: "key-setup",
      walletAddress: WALLET,
    });
  });
});

describe("the email field", () => {
  test("accepts a full address", () => {
    expect(isEmailAddress("name@example.com")).toBe(true);
  });

  test("refuses text that is not an address", () => {
    expect(isEmailAddress("bfjsdbkfjs")).toBe(false);
    expect(isEmailAddress("name@")).toBe(false);
    expect(isEmailAddress("")).toBe(false);
  });
});
