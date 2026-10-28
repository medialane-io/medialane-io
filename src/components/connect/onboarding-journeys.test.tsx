import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MedialaneApiError } from "@medialane/sdk";

const WALLET = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";

const api = { account: { emailExists: mock(async (_email: string) => false), registerEmailAccount: mock(async (_email: string) => ({})), requestEmailCode: mock(async (_email: string) => ({})), verifyEmailCode: mock(async (_email: string, _code: string) => ({})), upsertMyWallet: mock(async (..._args: unknown[]) => ({})), sessionWallet: (...args: unknown[]) => getSessionWallet(...args) } };
const completeDeployment = mock(async (_onStep: (s: string) => void) => ({ sealed: {} }));
const getSessionWallet = mock(async (..._args: unknown[]): Promise<{ walletAddress: string; needsKeySetup: boolean } | null> => null);
const claimSessionWallet = mock(async (..._args: unknown[]) => undefined);

const real = {
  client: await import("@/lib/wallet/client"),
  store: await import("@/lib/wallet/store"),
  passkey: await import("@/lib/wallet/passkey"),
  devices: await import("@/lib/wallet/devices"),
  confetti: await import("@medialane/ui/utils/media-wallet/confetti"),
  session: await import("@/hooks/use-wallet-native-session"),
  sessionHook: await import("@/hooks/use-session"),
  starknet: await import("@medialane/sdk/starknet"),
};

mock.module("@/lib/medialane-client", () => ({ getMedialaneClient: () => ({ api }) }));
mock.module("@/lib/wallet/client", () => ({ ...real.client, mediaWallet: { ...real.client.mediaWallet, completeDeployment } }));
mock.module("@medialane/sdk/starknet", () => ({ ...real.starknet, claimSessionWallet }));
let localOwner: { address: string } | null = null;
mock.module("@/lib/wallet/store", () => ({ ...real.store, loadSealedOwner: () => localOwner, saveSealedOwner: () => {}, notifyWalletChange: () => {} }));
let restoredKeyIsOwner = true;
mock.module("@/lib/wallet/passkey", () => ({ ...real.passkey, createOwnerKey: async () => ({}), sealImportedOwnerKey: async (key: { walletAddress: string }) => ({ address: key.walletAddress, ownerPubKey: "0x1" }) }));
mock.module("@/lib/wallet/devices", () => ({ ...real.devices, removeDevice: async () => {}, isOwnerOf: async () => restoredKeyIsOwner }));
mock.module("@medialane/ui/utils/media-wallet/confetti", () => ({ ...real.confetti, fireConfetti: () => {} }));
mock.module("@/hooks/use-wallet-native-session", () => ({ ...real.session, useWalletNativeSession: () => ({ hasWallet: false }) }));
let session: { email: string; walletAddress: string | null } | null = null;
mock.module("@/hooks/use-session", () => ({ ...real.sessionHook, useSession: () => ({ session, isLoading: false }), refreshSession: async () => undefined }));

const { OnboardingFlow } = await import("./onboarding-flow");

const done: Array<{ celebrated: boolean }> = [];
const onDone = (result: { celebrated: boolean }) => void done.push(result);

beforeEach(() => {
  done.length = 0;
  for (const m of [api.account.emailExists, api.account.registerEmailAccount, api.account.requestEmailCode, api.account.verifyEmailCode, api.account.upsertMyWallet]) m.mockClear();
  completeDeployment.mockClear();
  getSessionWallet.mockClear();
  claimSessionWallet.mockClear();
  localStorage.clear();
  localOwner = null;
  restoredKeyIsOwner = true;
  session = null;
  api.account.emailExists.mockImplementation(async () => false);
  api.account.registerEmailAccount.mockImplementation(async () => ({}));
  api.account.verifyEmailCode.mockImplementation(async () => ({}));
  completeDeployment.mockImplementation(async () => ({ sealed: {} }));
  getSessionWallet.mockImplementation(async () => null);
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
  test("registers, makes a wallet, and finishes with a celebration without a separate link call", async () => {
    await enterEmail("new@example.com");
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.account.emailExists).toHaveBeenCalledWith("new@example.com");
    expect(api.account.registerEmailAccount).toHaveBeenCalledWith("new@example.com");
    expect(api.account.requestEmailCode).not.toHaveBeenCalled();
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(api.account.upsertMyWallet).not.toHaveBeenCalled();
  });
});

describe("someone signed in whose account has no wallet yet", () => {
  test("goes straight to securing the account, with no email or code asked again", async () => {
    session = { email: "signed-in@example.com", walletAddress: null };
    render(<OnboardingFlow onDone={onDone} />);
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(api.account.emailExists).not.toHaveBeenCalled();
    expect(api.account.requestEmailCode).not.toHaveBeenCalled();
  });
});

describe("an address that is not an email", () => {
  test("gets a clear message and nothing is sent", async () => {
    await enterEmail("bfjsdbkfjs");
    await waitFor(() => expect(screen.getByText("Please enter your full email address, like name@example.com.")).toBeTruthy());
    expect(api.account.emailExists).not.toHaveBeenCalled();
  });
});

describe("an address that already has an account", () => {
  test("is sent a login code instead of being registered", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    await enterEmail("old@example.com");
    await waitFor(() => expect(api.account.requestEmailCode).toHaveBeenCalledWith("old@example.com"));
    expect(api.account.registerEmailAccount).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter the 6-digit code/)).toBeTruthy();
  });

  test("one that turns out to exist while registering also gets a code", async () => {
    api.account.registerEmailAccount.mockImplementation(async () => {
      throw new MedialaneApiError(409, "ACCOUNT_EXISTS");
    });
    await enterEmail("race@example.com");
    await waitFor(() => expect(api.account.requestEmailCode).toHaveBeenCalledWith("race@example.com"));
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("retry after a failed first try: the code verifies the email, then the missing wallet is made", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    await enterEmail("retry@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.account.verifyEmailCode).toHaveBeenCalledWith("retry@example.com", "123456");
    expect(getSessionWallet).toHaveBeenCalledTimes(1);
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("a returning user whose wallet is ready signs in and finishes with no new wallet and no celebration", async () => {
    localOwner = { address: WALLET };
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("back@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("a returning user on a browser without their key is asked for their recovery key, not sent home signed out", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    await waitFor(() => expect(screen.getByText(/Paste your recovery key to open your wallet on this browser/)).toBeTruthy());
    expect(done).toEqual([]);
    expect(screen.getByPlaceholderText("medialane-recovery:v1:…")).toBeTruthy();
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("the recovery key step offers a way to keep browsing and a way back to the email step", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    expect(screen.getByRole("link", { name: "Keep browsing" }).getAttribute("href")).toBe("/");
    fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
    const email = await waitFor(() => screen.getByPlaceholderText("you@example.com") as HTMLInputElement);
    expect(email.value).toBe("");
    expect(screen.queryByPlaceholderText("medialane-recovery:v1:…")).toBeNull();
    expect(done).toEqual([]);
  });

  test("pasting the recovery key on a new browser opens the wallet and finishes", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    const input = await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    const { privateKeyHex } = real.starknet.generateStarkKeyPair();
    fireEvent.change(input, { target: { value: real.starknet.encodeRecoveryKey({ walletAddress: WALLET, privateKey: privateKeyHex }) } });
    fireEvent.click(screen.getByRole("button", { name: /Restore my wallet/ }));
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
  });

  test("a recovery key that does not control the wallet is refused and nothing finishes", async () => {
    restoredKeyIsOwner = false;
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    const input = await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    const { privateKeyHex } = real.starknet.generateStarkKeyPair();
    fireEvent.change(input, { target: { value: real.starknet.encodeRecoveryKey({ walletAddress: WALLET, privateKey: privateKeyHex }) } });
    fireEvent.click(screen.getByRole("button", { name: /Restore my wallet/ }));
    await waitFor(() => expect(screen.getByText(/does not control this wallet/)).toBeTruthy());
    expect(done).toEqual([]);
  });

  test("a provisioned user's first login claims the wallet with their own key and celebrates", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: true }));
    await enterEmail("partner-user@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(claimSessionWallet).toHaveBeenCalledTimes(1);
    expect(claimSessionWallet.mock.calls[0]![1]).toBe(WALLET);
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("a wrong code shows a message and lets them try again", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    api.account.verifyEmailCode.mockImplementationOnce(async () => {
      throw new MedialaneApiError(400, "Incorrect code", undefined, { error: "Incorrect code" });
    });
    await enterEmail("typo@example.com");
    await enterCode("000000");
    await waitFor(() => expect(screen.getByText("Incorrect code")).toBeTruthy());
    expect(done).toEqual([]);
    expect(getSessionWallet).not.toHaveBeenCalled();
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
    expect(api.account.registerEmailAccount).toHaveBeenCalledTimes(1);
  });

  test("a passkey that can't protect a wallet keeps the new account, says so, and retries only the wallet", async () => {
    const unsupported = Object.assign(new Error("unsupported"), { name: "PasskeyUnsupportedError", reason: "no-prf" });
    completeDeployment.mockImplementationOnce(async () => {
      throw unsupported;
    });
    await enterEmail("no-prf@example.com");
    await waitFor(() => expect(screen.getByText(/Your account is saved/)).toBeTruthy());
    expect(api.account.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(done).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.account.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(completeDeployment).toHaveBeenCalledTimes(2);
  });
});
