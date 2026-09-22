import { describe, expect, test } from "bun:test";
import { describeWalletFailure, passkeysUnavailableMessage } from "./onboarding-flow.js";

describe("what someone is told when the wallet cannot be made", () => {
  test("an unsupported browser is named, briefly, with what to do", () => {
    const notice = describeWalletFailure(
      new Error("Brave doesn't currently support the WebAuthn PRF extension. Medialane needs it to seal your key."),
    );
    expect(notice.message).toBe("Brave can't create passkeys yet. Open medialane.io in Safari or Chrome to join.");
  });

  test("an unsupported browser is not offered a retry that cannot work", () => {
    const notice = describeWalletFailure(new Error("... WebAuthn PRF extension ..."));
    expect(notice.canRetry).toBe(false);
  });

  test("a browser that simply returned no secret gets the same advice", () => {
    const notice = describeWalletFailure(new Error("This browser didn't return a passkey PRF secret."));
    expect(notice.canRetry).toBe(false);
    expect(notice.message).toContain("Safari or Chrome");
  });

  test("any other failure is short and may be retried", () => {
    const notice = describeWalletFailure(new Error("socket hang up"));
    expect(notice.canRetry).toBe(true);
    expect(notice.message).toBe("We couldn't finish setting up your account. Please try again.");
  });

  test("a failure that is not an Error still produces a message", () => {
    expect(describeWalletFailure("boom").message).toBe("We couldn't finish setting up your account. Please try again.");
  });

  test("the message never mentions the extension by name", () => {
    for (const err of [new Error("WebAuthn PRF extension"), new Error("nope")]) {
      expect(describeWalletFailure(err).message).not.toContain("PRF");
      expect(describeWalletFailure(err).message).not.toContain("WebAuthn");
    }
  });
});

describe("telling someone before they start", () => {
  test("brave is named and given the way out", () => {
    expect(passkeysUnavailableMessage()).toBe("Brave can't create passkeys yet. Open medialane.io in Safari or Chrome to join.");
  });
});
