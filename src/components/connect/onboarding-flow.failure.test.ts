import { describe, expect, test } from "bun:test";
import { describeWalletFailure } from "./onboarding-flow.js";

describe("what someone is told when the wallet cannot be made", () => {
  const unsupported = (reason: string) => Object.assign(new Error("unsupported"), { name: "PasskeyUnsupportedError", reason });

  test("a passkey that can't protect a wallet suggests saving it elsewhere, and may be retried", () => {
    const notice = describeWalletFailure(unsupported("no-prf"));
    expect(notice.kind).toBe("unsupported-passkey");
    expect(notice.canRetry).toBe(true);
    expect(notice.message).toBe("Let's save your passkey in another place. Try again and choose your phone or password manager.");
  });

  test("no passkeys at all is not offered a retry that cannot work", () => {
    const notice = describeWalletFailure(unsupported("no-webauthn"));
    expect(notice.kind).toBe("no-passkeys");
    expect(notice.canRetry).toBe(false);
  });

  test("error text that merely mentions PRF is not treated as unsupported", () => {
    expect(describeWalletFailure(new Error("This browser didn't return a passkey PRF secret.")).kind).toBe("unknown");
  });

  test("any other failure is short and may be retried", () => {
    const notice = describeWalletFailure(new Error("socket hang up"));
    expect(notice.canRetry).toBe(true);
    expect(notice.message).toBe("We couldn't finish setting up your account. Please try again.");
  });

  test("a failure that is not an Error still produces a message", () => {
    expect(describeWalletFailure("boom").message).toBe("We couldn't finish setting up your account. Please try again.");
  });

  test("the message never names a browser we have not verified", () => {
    for (const err of [unsupported("no-prf"), unsupported("no-webauthn"), new Error("brave"), new Error("nope")]) {
      expect(describeWalletFailure(err).message).not.toContain("Safari");
      expect(describeWalletFailure(err).message).not.toContain("Chrome");
      expect(describeWalletFailure(err).message).not.toContain("Brave");
    }
  });

  test("the message never mentions the extension by name", () => {
    for (const err of [unsupported("no-prf"), unsupported("no-webauthn"), new Error("nope")]) {
      expect(describeWalletFailure(err).message).not.toContain("PRF");
      expect(describeWalletFailure(err).message).not.toContain("WebAuthn");
    }
  });
});
