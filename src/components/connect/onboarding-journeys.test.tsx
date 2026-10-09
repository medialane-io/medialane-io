import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MedialaneApiError } from "@medialane/sdk";
import { loadAccountEmail } from "@/lib/wallet/account-wallet";

const WALLET = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";

const api = {
  checkEmail: mock(async (_email: string) => ({ exists: false })),
  registerEmailAccount: mock(async (_email: string) => ({})),
  requestEmailCode: mock(async (_email: string) => ({})),
  verifyEmailCode: mock(async (_email: string, _code: string) => ({})),
  upsertMyWallet: mock(async (..._args: unknown[]) => ({})),
};
const completeDeployment = mock(async (_onStep: (s: string) => void) => ({ siwsToken: "siws" }));
const adoptSessionWallet = mock(async (..._args: unknown[]): Promise<{ walletAddress: string; needsKeySetup: boolean } | null> => null);
const claimSessionWallet = mock(async (..._args: unknown[]) => undefined);

const real = {
  client: await import("@/lib/wallet/client"),
  store: await import("@/lib/wallet/store"),
  passkey: await import("@/lib/wallet/passkey"),
  devices: await import("@/lib/wallet/devices"),
  confetti: await import("@/lib/confetti"),
  session: await import("@/hooks/use-wallet-native-session"),
  emailStatus: await import("@/hooks/use-email-verification-required"),
  siws: await import("@/hooks/use-siws-token"),
  starknet: await import("@medialane/sdk/starknet"),
};

mock.module("@/lib/medialane-client", () => ({ getMedialaneClient: () => ({ api }) }));
mock.module("@/lib/wallet/client", () => ({ ...real.client, mediaWallet: { ...real.client.mediaWallet, completeDeployment } }));
mock.module("@medialane/sdk/starknet", () => ({ ...real.starknet, adoptSessionWallet, claimSessionWallet }));
let localOwner: { address: string } | null = null;
mock.module("@/lib/wallet/store", () => ({ ...real.store, loadSealedOwner: () => localOwner, saveSealedOwner: () => {}, notifyWalletChange: () => {} }));
mock.module("@/lib/wallet/passkey", () => ({ ...real.passkey, createOwnerKey: async () => ({}) }));
mock.module("@/lib/wallet/devices", () => ({ ...real.devices, removeDevice: async () => {} }));
mock.module("@/lib/confetti", () => ({ ...real.confetti, fireConfetti: () => {} }));
mock.module("@/hooks/use-wallet-native-session", () => ({ ...real.session, useWalletNativeSession: () => ({ hasWallet: false }) }));
mock.module("@/hooks/use-email-verification-required", () => ({ ...real.emailStatus, useEmailVerificationStatus: () => null }));
mock.module("@/hooks/use-siws-token", () => ({ ...real.siws, useSiwsToken: () => ({ getValidToken: () => null, signIn: async () => null }) }));

const { OnboardingFlow } = await import("./onboarding-flow");

const done: Array<{ celebrated: boolean }> = [];
const onDone = (result: { celebrated: boolean }) => void done.push(result);

beforeEach(() => {
  done.length = 0;
  for (const m of [api.checkEmail, api.registerEmailAccount, api.requestEmailCode, api.verifyEmailCode, api.upsertMyWallet]) m.mockClear();
  completeDeployment.mockClear();
  adoptSessionWallet.mockClear();
  claimSessionWallet.mockClear();
  localStorage.clear();
  localOwner = null;
  api.checkEmail.mockImplementation(async () => ({ exists: false }));
  api.registerEmailAccount.mockImplementation(async () => ({}));
  api.verifyEmailCode.mockImplementation(async () => ({}));
  completeDeployment.mockImplementation(async () => ({ siwsToken: "siws" }));
  adoptSessionWallet.mockImplementation(async () => null);
});
afterEach(cleanup);

async function enterEmail(email: string) {
  render(<OnboardingFlow onDone={onDone} />);
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

async function enterCode(code = "123456") {
  const input = await waitFor(() => {
    const el = document.querySelector("input[data-input-otp]");
    if (!el) throw new Error("code input not shown");
    return el as HTMLInputElement;
  });
  fireEvent.change(input, { target: { value: code } });
}

describe("a new io user", () => {
  test("registers, makes a wallet, links it, and finishes with a celebration", async () => {
    await enterEmail("new@example.com");
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.checkEmail).toHaveBeenCalledWith("new@example.com");
    expect(api.registerEmailAccount).toHaveBeenCalledWith("new@example.com");
    expect(api.requestEmailCode).not.toHaveBeenCalled();
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(api.upsertMyWallet).toHaveBeenCalledTimes(1);
    expect(loadAccountEmail()).toBe("new@example.com");
  });
});

describe("an address that already has an account", () => {
  test("is sent a login code instead of being registered", async () => {
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    await enterEmail("old@example.com");
    await waitFor(() => expect(api.requestEmailCode).toHaveBeenCalledWith("old@example.com"));
    expect(api.registerEmailAccount).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter the 6-digit code/)).toBeTruthy();
  });

  test("one that turns out to exist while registering also gets a code", async () => {
    api.registerEmailAccount.mockImplementation(async () => {
      throw new MedialaneApiError(409, "ACCOUNT_EXISTS");
    });
    await enterEmail("race@example.com");
    await waitFor(() => expect(api.requestEmailCode).toHaveBeenCalledWith("race@example.com"));
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("retry after a failed first try: the code verifies the email, then the missing wallet is made", async () => {
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    await enterEmail("retry@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.verifyEmailCode).toHaveBeenCalledWith("retry@example.com", "123456");
    expect(adoptSessionWallet).toHaveBeenCalledTimes(1);
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("a returning user whose wallet is ready signs in and finishes with no new wallet and no celebration", async () => {
    localOwner = { address: WALLET };
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    adoptSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("back@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("a returning user on a browser without their key is told why and offered to link this device, not sent home signed out", async () => {
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    adoptSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    await waitFor(() => expect(screen.getByText(/Approve this browser from the device you used to sign up/)).toBeTruthy());
    expect(done).toEqual([]);
    expect(screen.getByRole("link", { name: /Approve this browser/ }).getAttribute("href")).toBe("/link-device");
    expect(screen.getByRole("link", { name: /recover/i }).getAttribute("href")).toBe("/recover");
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("a provisioned user's first login claims the wallet with their own key and celebrates", async () => {
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    adoptSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: true }));
    await enterEmail("partner-user@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(claimSessionWallet).toHaveBeenCalledTimes(1);
    expect(claimSessionWallet.mock.calls[0]![1]).toBe(WALLET);
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("a wrong code shows a message and lets them try again", async () => {
    api.checkEmail.mockImplementation(async () => ({ exists: true }));
    api.verifyEmailCode.mockImplementationOnce(async () => {
      throw new Error("Incorrect code");
    });
    await enterEmail("typo@example.com");
    await enterCode("000000");
    await waitFor(() => expect(screen.getByText(/Incorrect code|Something went wrong/)).toBeTruthy());
    expect(done).toEqual([]);
    expect(adoptSessionWallet).not.toHaveBeenCalled();
  });
});

describe("when the passkey step fails", () => {
  test("a closed prompt says so, and Try again resumes and finishes", async () => {
    const cancelled = Object.assign(new Error("Passkey prompt was cancelled."), { name: "PasskeyCancelledError" });
    completeDeployment.mockImplementationOnce(async () => {
      throw cancelled;
    });
    await enterEmail("closed@example.com");
    await waitFor(() => expect(screen.getByText(/The passkey prompt was closed|Passkeys aren't available/)).toBeTruthy());
    expect(done).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(completeDeployment).toHaveBeenCalledTimes(2);
    expect(api.registerEmailAccount).toHaveBeenCalledTimes(1);
  });

  test("a passkey that can't protect a wallet keeps the new account, says so, and retries only the wallet", async () => {
    const unsupported = Object.assign(new Error("unsupported"), { name: "PasskeyUnsupportedError", reason: "no-prf" });
    completeDeployment.mockImplementationOnce(async () => {
      throw unsupported;
    });
    await enterEmail("no-prf@example.com");
    await waitFor(() => expect(screen.getByText(/Your account is saved/)).toBeTruthy());
    expect(api.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(done).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(completeDeployment).toHaveBeenCalledTimes(2);
  });
});
