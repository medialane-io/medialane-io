import { describe, expect, test } from "bun:test";
import { describeWalletFailure } from "./onboarding-flow.js";

describe("what someone is told when the wallet cannot be made", () => {
  test("an unsupported browser is named, briefly, with what to do", () => {
    const notice = describeWalletFailure(
      new Error("Brave doesn't currently support the WebAuthn PRF extension. Medialane needs it to seal your key."),
    );
    expect(notice.message).toBe("Brave can't create passkeys yet. Please try another browser.");
  });

  test("an unsupported browser is not offered a retry that cannot work", () => {
    const notice = describeWalletFailure(new Error("... WebAuthn PRF extension ..."));
    expect(notice.canRetry).toBe(false);
  });

  test("a browser that simply returned no secret gets the same advice", () => {
    const notice = describeWalletFailure(new Error("This browser didn't return a passkey PRF secret."));
    expect(notice.canRetry).toBe(false);
    expect(notice.message).toContain("another browser");
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
    for (const err of [new Error("WebAuthn PRF extension"), new Error("brave"), new Error("nope")]) {
      expect(describeWalletFailure(err).message).not.toContain("Safari");
      expect(describeWalletFailure(err).message).not.toContain("Chrome");
    }
  });

  test("the message never mentions the extension by name", () => {
    for (const err of [new Error("WebAuthn PRF extension"), new Error("nope")]) {
      expect(describeWalletFailure(err).message).not.toContain("PRF");
      expect(describeWalletFailure(err).message).not.toContain("WebAuthn");
    }
  });
});
