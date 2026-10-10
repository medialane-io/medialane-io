import { describe, expect, test } from "bun:test";
import { flowReducer, initialFlow, retryTarget, type FlowEvent, type FlowState } from "./flow";

const run = (state: FlowState, ...events: FlowEvent[]): FlowState => events.reduce(flowReducer, state);
const fresh = initialFlow("email");

describe("where the flow starts", () => {
  test("on the email step, or straight on the wallet step when resuming", () => {
    expect(initialFlow("email").step).toBe("email");
    expect(initialFlow("wallet").step).toBe("creating-passkey");
  });

  test("with no error, a retry available, no account known and no key setup pending", () => {
    expect(fresh).toEqual({ step: "email", error: null, canRetry: true, accountExisted: false, keySetupAddress: null });
  });
});

describe("a new user's journey", () => {
  test("email, registered, then wallet steps, then done", () => {
    let s = run(fresh, { type: "email-submitted" });
    expect(s.step).toBe("checking-email");
    s = run(s, { type: "account-found", exists: false }, { type: "registering" });
    expect(s.step).toBe("registering");
    expect(s.accountExisted).toBe(false);
    s = run(s, { type: "wallet-setup-started" }, { type: "wallet-progress", step: "deploying" }, { type: "wallet-progress", step: "signing-in" });
    expect(s.step).toBe("signing-in");
    expect(run(s, { type: "finished" }).step).toBe("done");
  });
});

describe("an address that already has an account", () => {
  test("remembers that, sends the code, and verifying it moves to the code and verifying steps", () => {
    let s = run(fresh, { type: "email-submitted" }, { type: "account-found", exists: true }, { type: "code-sent" });
    expect(s).toMatchObject({ step: "code", accountExisted: true });
    s = run(s, { type: "code-submitted" });
    expect(s.step).toBe("verifying-code");
  });

  test("a registration that turns out to exist is the same: accountExisted is set before the code step", () => {
    const s = run(fresh, { type: "email-submitted" }, { type: "registering" }, { type: "account-found", exists: true }, { type: "code-sent" });
    expect(s).toMatchObject({ step: "code", accountExisted: true });
  });

  test("a wrong code goes back to the code step with the message, and clears when they try again", () => {
    let s = run(fresh, { type: "code-submitted" }, { type: "code-failed", message: "Incorrect code" });
    expect(s).toMatchObject({ step: "code", error: "Incorrect code" });
    s = run(s, { type: "code-submitted" });
    expect(s).toMatchObject({ step: "verifying-code", error: null });
  });

  test("a failure sending the code stays on the email step with the message", () => {
    expect(run(fresh, { type: "email-submitted" }, { type: "email-step-failed", message: "Couldn't send" })).toMatchObject({
      step: "email",
      error: "Couldn't send",
    });
  });
});

describe("when the wallet step fails", () => {
  test("it stays on the wallet step with the message and says whether a retry can work", () => {
    const s = run(fresh, { type: "wallet-setup-started" }, { type: "wallet-failed", message: "Closed", canRetry: true });
    expect(s).toMatchObject({ step: "creating-passkey", error: "Closed", canRetry: true });
    expect(run(s, { type: "wallet-failed", message: "Unsupported", canRetry: false }).canRetry).toBe(false);
  });

  test("starting again clears the message and allows a retry", () => {
    const s = run(fresh, { type: "wallet-failed", message: "x", canRetry: false }, { type: "wallet-setup-started" });
    expect(s).toMatchObject({ error: null, canRetry: true, step: "creating-passkey" });
  });

  test("a wallet that needs linking to an email account goes back to the email step", () => {
    expect(run(fresh, { type: "wallet-setup-started" }, { type: "link-required" }).step).toBe("email");
  });
});

describe("a provisioned user's key setup", () => {
  test("remembers which wallet it is for, so a retry targets the same wallet, and forgets it when done", () => {
    let s = run(fresh, { type: "key-setup-started", address: "0xabc" });
    expect(s).toMatchObject({ step: "creating-passkey", keySetupAddress: "0xabc" });
    s = run(s, { type: "wallet-failed", message: "x", canRetry: true });
    expect(retryTarget(s)).toEqual({ type: "key-setup", walletAddress: "0xabc" });
    s = run(s, { type: "key-setup-finished" });
    expect(retryTarget(s)).toEqual({ type: "wallet-setup" });
  });

  test("with no key setup pending a retry makes the wallet", () => {
    expect(retryTarget(fresh)).toEqual({ type: "wallet-setup" });
  });
});
