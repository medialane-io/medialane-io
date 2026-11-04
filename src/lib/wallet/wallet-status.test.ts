import { describe, expect, test } from "bun:test";
import { walletStatus, type WalletStatusInput } from "./wallet-status";

const READY: WalletStatusInput = {
  sessionLoading: false,
  signedIn: true,
  sessionHasWallet: true,
  keyHere: true,
  isDeployed: true,
  step: "finish",
};

const status = (overrides: Partial<WalletStatusInput>) => walletStatus({ ...READY, ...overrides });

describe("the wallet status on this browser", () => {
  test("is ready when this browser's key is on the deployed wallet and its setup is finished", () => {
    expect(status({})).toBe("ready");
  });

  test("is none when nobody is signed in", () => {
    expect(status({ signedIn: false, sessionHasWallet: false, keyHere: false })).toBe("none");
  });

  test("is checking while the session, the deployment or the wallet check is not known yet", () => {
    expect(status({ sessionLoading: true })).toBe("checking");
    expect(status({ isDeployed: null })).toBe("checking");
    expect(status({ step: undefined })).toBe("checking");
  });

  test("needs setup for an account without a wallet", () => {
    expect(status({ sessionHasWallet: false, keyHere: false })).toBe("needs-setup");
  });

  test("is none when the account's key is on another browser", () => {
    expect(status({ keyHere: false, isDeployed: null, step: undefined })).toBe("none");
  });

  test("needs setup for a wallet that never finished deploying", () => {
    expect(status({ isDeployed: false })).toBe("needs-setup");
  });

  test("needs setup when the wallet setup stopped halfway", () => {
    expect(status({ step: "key-setup" })).toBe("needs-setup");
  });

  test("needs setup when the wallet does not have this browser's key", () => {
    expect(status({ step: "restore-key" })).toBe("needs-setup");
  });

  test("stays ready when the wallet could not be checked", () => {
    expect(status({ step: null })).toBe("ready");
  });
});
