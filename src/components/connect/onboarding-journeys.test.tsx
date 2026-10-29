import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MedialaneApiError } from "@medialane/sdk";

const WALLET = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";

const api = { account: { emailExists: mock(async (_email: string) => false), registerEmailAccount: mock(async (_email: string) => ({})), requestEmailCode: mock(async (_email: string) => ({})), verifyEmailCode: mock(async (_email: string, _code: string) => ({})), upsertMyWallet: mock(async (..._args: unknown[]) => ({})), sessionWallet: (...args: unknown[]) => getSessionWallet(...args), walletRecovery: (...args: unknown[]) => getRecovery(...args), startWalletRecovery: (...args: unknown[]) => startRecovery(...args), completeWalletRecovery: (...args: unknown[]) => completeRecovery(...args) } };
type Recovery = { enabled: boolean; state: "none" | "waiting" | "ready"; readyAt: number | null; newOwnerGuid: string | null; guardianPubkey: string | null };
const RECOVERY_OFF: Recovery = { enabled: false, state: "none", readyAt: null, newOwnerGuid: null, guardianPubkey: null };
const getRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
const startRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
const completeRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
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
let createKeyError: Error | null = null;
mock.module("@/lib/wallet/passkey", () => ({ ...real.passkey, createOwnerKey: async () => { if (createKeyError) throw createKeyError; return { privateKeyHex: "0x1", sealed: { credentialId: "c", ownerPubKey: "0x222", address: "0x999", iv: "i", ciphertext: "x" } }; }, sealImportedOwnerKey: async (key: { walletAddress: string }) => ({ address: key.walletAddress, ownerPubKey: "0x1" }) }));
mock.module("@/lib/wallet/devices", () => ({ ...real.devices, removeDevice: async () => {}, isOwnerOf: async () => restoredKeyIsOwner }));
mock.module("@medialane/ui/utils/media-wallet/confetti", () => ({ ...real.confetti, fireConfetti: () => {} }));
let nativeSession: { hasWallet: boolean; isDeployed: boolean | null } = { hasWallet: false, isDeployed: null };
mock.module("@/hooks/use-wallet-native-session", () => ({ ...real.session, useWalletNativeSession: () => nativeSession }));
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
  for (const m of [getRecovery, startRecovery, completeRecovery]) m.mockClear();
  getRecovery.mockImplementation(async () => RECOVERY_OFF);
  claimSessionWallet.mockClear();
  localStorage.clear();
  localOwner = null;
  restoredKeyIsOwner = true;
  createKeyError = null;
  nativeSession = { hasWallet: false, isDeployed: null };
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

describe("the onboarding page opened by someone not signed in", () => {
  test("sets nothing up", async () => {
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });
});

describe("someone signed in whose wallet is already set up on this browser", () => {
  const signedInWithKey = (isDeployed: boolean | null) => {
    session = { email: "signed-in@example.com", walletAddress: WALLET };
    nativeSession = { hasWallet: true, isDeployed };
  };

  test("never gets a second wallet, whatever page they open", async () => {
    signedInWithKey(true);
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("waits until it is known whether the wallet is finished before doing anything", async () => {
    signedInWithKey(null);
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("a wallet that never finished deploying is finished with the key already here", async () => {
    signedInWithKey(false);
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await waitFor(() => expect(completeDeployment).toHaveBeenCalledTimes(1));
  });
});

describe("someone signed in whose wallet is not on this browser", () => {
  test("is shown how to open it here and never gets a second wallet", async () => {
    session = { email: "signed-in@example.com", walletAddress: WALLET };
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await waitFor(() => screen.getByText(/Finish your account setup|turn on recovery/));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
    expect(api.account.requestEmailCode).not.toHaveBeenCalled();
    expect(done).toEqual([]);
  });

  test("a provisioned account that still needs its own key gets it set up instead", async () => {
    session = { email: "signed-in@example.com", walletAddress: WALLET };
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: true }));
    render(<OnboardingFlow start="wallet" onDone={onDone} />);
    await waitFor(() => expect(claimSessionWallet).toHaveBeenCalledTimes(1));
    expect(completeDeployment).not.toHaveBeenCalled();
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

  test("a returning user on a browser without their key is told where their wallet is, not sent home signed out", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    await waitFor(() => expect(screen.getByText(/turn on recovery/)).toBeTruthy());
    await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    expect(done).toEqual([]);
    expect(screen.getByPlaceholderText("medialane-recovery:v1:…")).toBeTruthy();
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("pasting the recovery key on a new browser opens the wallet and finishes", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    const input = await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    const { privateKeyHex } = real.starknet.generateStarkKeyPair();
    fireEvent.change(input, { target: { value: real.starknet.encodeRecoveryKey({ walletAddress: WALLET, privateKey: privateKeyHex }) } });
    fireEvent.click(screen.getByRole("button", { name: /Restore my account/ }));
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
  });

  test("a recovery key that does not open the account is refused and nothing finishes", async () => {
    restoredKeyIsOwner = false;
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    const input = await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    const { privateKeyHex } = real.starknet.generateStarkKeyPair();
    fireEvent.change(input, { target: { value: real.starknet.encodeRecoveryKey({ walletAddress: WALLET, privateKey: privateKeyHex }) } });
    fireEvent.click(screen.getByRole("button", { name: /Restore my account/ }));
    await waitFor(() => expect(screen.getByText(/does not open this account/)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(/Your account setup is not complete/)).toBeTruthy());
    expect(api.account.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(done).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(api.account.registerEmailAccount).toHaveBeenCalledTimes(1);
    expect(completeDeployment).toHaveBeenCalledTimes(2);
  });
});

describe("recovering by email on a new browser", () => {
  const ON: Recovery = { ...RECOVERY_OFF, enabled: true };
  const reachRecoveryStep = async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    session = { email: "new-browser@example.com", walletAddress: WALLET };
    await enterEmail("new-browser@example.com");
    await enterCode();
    await waitFor(() => screen.getByText(/Finish your account setup|turn on recovery/));
  };

  test("a wallet that has not turned recovery on is told to do it on its other browser and can paste a key", async () => {
    await reachRecoveryStep();
    await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    expect(screen.getByText(/turn on recovery/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Recover with my email" })).toBeNull();
  });

  test("a wallet that has turned recovery on leads with recovery by email and no key field", async () => {
    getRecovery.mockImplementation(async () => ON);
    await reachRecoveryStep();
    await waitFor(() => screen.getByRole("button", { name: "Recover with my email" }));
    expect(screen.queryByPlaceholderText("medialane-recovery:v1:…")).toBeNull();
    expect(screen.queryByText(/turn on recovery/)).toBeNull();
    expect(screen.queryByText(/already waiting/)).toBeNull();
  });

  test("starting it keeps this browser's new key aside, shows the wait, and finishes nothing yet", async () => {
    getRecovery.mockImplementation(async () => ON);
    startRecovery.mockImplementation(async () => ({ ...ON, state: "waiting", readyAt: 1_900_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x222") }));
    await reachRecoveryStep();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Recover with my email" })));
    await waitFor(() => expect(screen.getByText(/Recovery started/)).toBeTruthy());
    expect(startRecovery).toHaveBeenCalledWith({ newOwnerPubkey: "0x222" });
    expect(real.client.ownerStore.loadPending()?.address).toBe(WALLET);
    expect(real.client.ownerStore.load()).toBeNull();
    expect(done).toEqual([]);
  });

  test("a passkey prompt that is closed says so and leaves the button to try again", async () => {
    getRecovery.mockImplementation(async () => ON);
    createKeyError = Object.assign(new Error("closed"), { name: "PasskeyCancelledError" });
    await reachRecoveryStep();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Recover with my email" })));
    await waitFor(() => expect(screen.getByText(/The passkey prompt was closed|Passkeys aren't available/)).toBeTruthy());
    expect(startRecovery).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Recover with my email" })).toBeTruthy();
  });

  test("when the wait is over, one tap opens the wallet and finishes", async () => {
    real.client.ownerStore.savePending({ credentialId: "c", ownerPubKey: "0x222", address: WALLET, iv: "i", ciphertext: "x" });
    getRecovery.mockImplementation(async () => ({ ...ON, state: "ready", readyAt: 1_800_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x222") }));
    await reachRecoveryStep();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Open my account" })));
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
    expect(completeRecovery).toHaveBeenCalledWith({ newOwnerPubkey: "0x222" });
    expect(real.client.ownerStore.loadPending()).toBeNull();
  });

  test("a recovery that is waiting for another browser's key can be taken over from this one", async () => {
    getRecovery.mockImplementation(async () => ({ ...ON, state: "waiting", readyAt: 1_900_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x777") }));
    await reachRecoveryStep();
    expect(await waitFor(() => screen.getByRole("button", { name: "Recover with my email" }))).toBeTruthy();
    expect(screen.getByText(/A recovery is already waiting for this account/)).toBeTruthy();
  });
});
