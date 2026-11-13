import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MedialaneApiError } from "@medialane/sdk";
import { mockForThisFile } from "../../../test/mock-for-this-file";

const RECOVERY_KEY_OPTION = "I have my recovery key";
const NO_KEY_OPTION = "I can't find my recovery key";
const NEW_WALLET_LINK = "Start a new wallet instead";
const WALLET = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";

const api = { account: { emailExists: mock(async (_email: string) => false), registerEmailAccount: mock(async (_email: string) => ({})), requestEmailCode: mock(async (_email: string) => ({})), verifyEmailCode: mock(async (_email: string, _code: string) => ({})), upsertMyWallet: mock(async (..._args: unknown[]) => ({})), sessionWallet: (...args: unknown[]) => getSessionWallet(...args), walletRecovery: (...args: unknown[]) => getRecovery(...args), startWalletRecovery: (...args: unknown[]) => startRecovery(...args), completeWalletRecovery: (...args: unknown[]) => completeRecovery(...args), contactSupport: mock(async (_params: { message?: string }) => undefined) } };
type Recovery = { enabled: boolean; state: "none" | "waiting" | "ready"; readyAt: number | null; newOwnerGuid: string | null; guardianPubkey: string | null };
const RECOVERY_OFF: Recovery = { enabled: false, state: "none", readyAt: null, newOwnerGuid: null, guardianPubkey: null };
const getRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
const startRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
const completeRecovery = mock(async (..._args: unknown[]): Promise<Recovery> => RECOVERY_OFF);
const completeDeployment = mock(async (_onStep: (s: string) => void, _options?: { replace?: boolean }) => ({ sealed: {} }));
const getSessionWallet = mock(async (..._args: unknown[]): Promise<{ walletAddress: string; needsKeySetup: boolean } | null> => null);
const claimSessionWallet = mock(async (..._args: unknown[]) => undefined);

type WalletClient = typeof import("@/lib/wallet/client");
await mockForThisFile("@/lib/medialane-client", { getMedialaneClient: () => ({ api }) as never });
const real = {
  client: await mockForThisFile<WalletClient>("@/lib/wallet/client", (client) => ({
    mediaWallet: { ...client.mediaWallet, completeDeployment } as never,
  })),
  starknet: await mockForThisFile("@medialane/sdk/starknet", { claimSessionWallet: claimSessionWallet as never }),
};
let localOwner: { address: string } | null = null;
await mockForThisFile("@/lib/wallet/store", {
  loadSealedOwner: () => localOwner as never,
  saveSealedOwner: () => {},
  notifyWalletChange: () => {},
});
let restoredKeyIsOwner = true;
let createKeyError: Error | null = null;
await mockForThisFile("@/lib/wallet/passkey", {
  createOwnerKey: (async () => {
    if (createKeyError) throw createKeyError;
    return { privateKeyHex: "0x1", sealed: { credentialId: "c", ownerPubKey: "0x222", address: "0x999", iv: "i", ciphertext: "x" } };
  }) as never,
  sealImportedOwnerKey: (async (key: { walletAddress: string }) => ({ address: key.walletAddress, ownerPubKey: "0x1" })) as never,
});
await mockForThisFile("@/lib/wallet/devices", { removeDevice: async () => {}, isOwnerOf: async () => restoredKeyIsOwner });
await mockForThisFile("@medialane/ui/utils/media-wallet/confetti", { fireConfetti: () => {} });
let nativeSession: { hasWallet: boolean; isDeployed: boolean | null; status: string } = { hasWallet: false, isDeployed: null, status: "none" };
await mockForThisFile("@/hooks/use-wallet-native-session", { useWalletNativeSession: () => nativeSession as never });
let session: { email: string; walletAddress: string | null } | null = null;
await mockForThisFile("@medialane/ui/utils/use-session", {
  useSession: () => ({ session, isLoading: false }) as never,
  refreshSession: async () => undefined as never,
});

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
  nativeSession = { hasWallet: false, isDeployed: null, status: "none" };
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
    nativeSession = { hasWallet: true, isDeployed, status: isDeployed === true ? "ready" : isDeployed === false ? "needs-setup" : "checking" };
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

describe("someone with a sign-in cookie whose wallet is not on this browser", () => {
  test("is asked for their email like anyone else, and nothing is set up", async () => {
    session = { email: "signed-in@example.com", walletAddress: WALLET };
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    render(<OnboardingFlow onDone={onDone} />);
    await waitFor(() => screen.getByPlaceholderText("you@example.com"));
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
    expect(getSessionWallet).not.toHaveBeenCalled();
    expect(done).toEqual([]);
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
    await waitFor(() => screen.getByRole("button", { name: RECOVERY_KEY_OPTION }));
    expect(screen.getByRole("button", { name: NO_KEY_OPTION })).toBeTruthy();
    expect(screen.getByRole("button", { name: NEW_WALLET_LINK })).toBeTruthy();
    expect(screen.queryByPlaceholderText("medialane-recovery:v1:…")).toBeNull();
    expect(done).toEqual([]);
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(claimSessionWallet).not.toHaveBeenCalled();
  });

  test("pasting the recovery key on a new browser opens the wallet and finishes", async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: RECOVERY_KEY_OPTION })));
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
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: RECOVERY_KEY_OPTION })));
    const input = await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    const { privateKeyHex } = real.starknet.generateStarkKeyPair();
    fireEvent.change(input, { target: { value: real.starknet.encodeRecoveryKey({ walletAddress: WALLET, privateKey: privateKeyHex }) } });
    fireEvent.click(screen.getByRole("button", { name: /Restore my account/ }));
    await waitFor(() => expect(screen.getByText(/does not open this account/)).toBeTruthy());
    expect(done).toEqual([]);
  });

  const reachNewWalletConfirm = async () => {
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: NEW_WALLET_LINK })));
  };

  test("choosing a new wallet asks first, in the page, then replaces the wallet and finishes", async () => {
    await reachNewWalletConfirm();
    await waitFor(() => screen.getByText("Start a new wallet?"));
    expect(completeDeployment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => screen.getByRole("button", { name: NEW_WALLET_LINK }));
    expect(completeDeployment).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: NEW_WALLET_LINK }));
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Start a new wallet" })));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(completeDeployment).toHaveBeenCalledTimes(1);
    expect(completeDeployment.mock.calls[0]![1]).toEqual({ replace: true });
  });

  test("a failed new wallet is retried as a replacement", async () => {
    await reachNewWalletConfirm();
    completeDeployment.mockImplementationOnce(async () => {
      throw new Error("deploy failed");
    });
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Start a new wallet" })));
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Try again" })));
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(completeDeployment.mock.calls.map((c) => c[1])).toEqual([{ replace: true }, { replace: true }]);
  });

  test("the new wallet confirmation offers support first, and sending a note reaches support", async () => {
    session = { email: "new-browser@example.com", walletAddress: WALLET };
    await reachNewWalletConfirm();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Write to our team" })));
    fireEvent.change(await waitFor(() => screen.getByLabelText(/What happened/)), { target: { value: "I lost my key" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => screen.getByText(/we've got your message/));
    expect(api.account.contactSupport).toHaveBeenCalledWith({ message: "I lost my key" });
    expect(completeDeployment).not.toHaveBeenCalled();
    expect(done).toEqual([]);
  });

  test("support can be written to without a note, from the missing key option", async () => {
    session = { email: "new-browser@example.com", walletAddress: WALLET };
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: NO_KEY_OPTION })));
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Send" })));
    await waitFor(() => screen.getByText(/we've got your message/));
    expect(api.account.contactSupport).toHaveBeenCalledWith({ message: undefined });
  });

  test("a failed send says why and keeps the note", async () => {
    session = { email: "new-browser@example.com", walletAddress: WALLET };
    api.account.contactSupport.mockImplementationOnce(async () => {
      throw new MedialaneApiError(502, "The message could not be sent");
    });
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: NO_KEY_OPTION })));
    fireEvent.change(await waitFor(() => screen.getByLabelText(/What happened/)), { target: { value: "help" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(document.body.textContent).toContain("with support"));
    expect((screen.getByLabelText(/What happened/) as HTMLTextAreaElement).value).toBe("help");
  });

  test("a different email can be used from this step", async () => {
    const realFetch = globalThis.fetch;
    const fetchMock = mock(async () => new Response(null, { status: 200 }));
    globalThis.fetch = fetchMock as never;
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("new-browser@example.com");
    await enterCode();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Use a different email" })));
    await waitFor(() => screen.getByPlaceholderText("you@example.com"));
    expect((screen.getByPlaceholderText("you@example.com") as HTMLInputElement).value).toBe("");
    expect(fetchMock.mock.calls[0]).toEqual(["/api/session", { method: "DELETE" }]);
    expect(completeDeployment).not.toHaveBeenCalled();
    globalThis.fetch = realFetch;
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

  test("a setup that stopped after this browser saved its key is finished with that key after login", async () => {
    localOwner = { address: WALLET };
    restoredKeyIsOwner = false;
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: true }));
    await enterEmail("stopped-halfway@example.com");
    await enterCode();
    await waitFor(() => expect(done).toEqual([{ celebrated: true }]));
    expect(claimSessionWallet).toHaveBeenCalledTimes(1);
    expect(claimSessionWallet.mock.calls[0]![1]).toBe(WALLET);
    expect(completeDeployment).not.toHaveBeenCalled();
  });

  test("a browser whose key the wallet does not have is asked for the recovery key after login, not finished", async () => {
    localOwner = { address: WALLET };
    restoredKeyIsOwner = false;
    api.account.emailExists.mockImplementation(async () => true);
    getSessionWallet.mockImplementation(async () => ({ walletAddress: WALLET, needsKeySetup: false }));
    await enterEmail("key-not-on-wallet@example.com");
    await enterCode();
    await waitFor(() => screen.getByRole("button", { name: RECOVERY_KEY_OPTION }));
    expect(done).toEqual([]);
    expect(claimSessionWallet).not.toHaveBeenCalled();
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
    await waitFor(() => {
      if (!screen.queryByText(/Finish your account setup/)) screen.getByRole("button", { name: RECOVERY_KEY_OPTION });
    });
  };

  test("a wallet that has not turned recovery on offers a recovery key or a new wallet", async () => {
    await reachRecoveryStep();
    await waitFor(() => screen.getByRole("button", { name: RECOVERY_KEY_OPTION }));
    expect(screen.getByRole("button", { name: NO_KEY_OPTION })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Recover with my email" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: RECOVERY_KEY_OPTION }));
    await waitFor(() => screen.getByPlaceholderText("medialane-recovery:v1:…"));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => screen.getByRole("button", { name: NO_KEY_OPTION }));
  });

  test("a wallet that has turned recovery on leads with recovery by email and no key field", async () => {
    getRecovery.mockImplementation(async () => ON);
    await reachRecoveryStep();
    await waitFor(() => screen.getByRole("button", { name: "Recover with my email" }));
    expect(screen.queryByPlaceholderText("medialane-recovery:v1:…")).toBeNull();
    expect(screen.queryByText(/already waiting/)).toBeNull();
  });

  test("starting it keeps this browser's new key aside, shows the wait, and finishes nothing yet", async () => {
    getRecovery.mockImplementation(async () => ON);
    startRecovery.mockImplementation(async () => ({ ...ON, state: "waiting", readyAt: 1_900_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x222") }));
    await reachRecoveryStep();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Recover with my email" })));
    await waitFor(() => expect(screen.getByText(/Recovery started/)).toBeTruthy());
    expect(startRecovery).toHaveBeenCalledWith({ newOwnerPubkey: "0x222" });
    expect(real.client.ownerStore.loadRecovery()?.address).toBe(WALLET);
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
    real.client.ownerStore.saveRecovery({ credentialId: "c", ownerPubKey: "0x222", address: WALLET, iv: "i", ciphertext: "x" });
    getRecovery.mockImplementation(async () => ({ ...ON, state: "ready", readyAt: 1_800_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x222") }));
    await reachRecoveryStep();
    fireEvent.click(await waitFor(() => screen.getByRole("button", { name: "Open my account" })));
    await waitFor(() => expect(done).toEqual([{ celebrated: false }]));
    expect(completeRecovery).toHaveBeenCalledWith({ newOwnerPubkey: "0x222" });
    expect(real.client.ownerStore.loadRecovery()).toBeNull();
  });

  test("a recovery that is waiting for another browser's key can be taken over from this one", async () => {
    getRecovery.mockImplementation(async () => ({ ...ON, state: "waiting", readyAt: 1_900_000_000, newOwnerGuid: real.starknet.computeOwnerGuid("0x777") }));
    await reachRecoveryStep();
    expect(await waitFor(() => screen.getByRole("button", { name: "Recover with my email" }))).toBeTruthy();
    expect(screen.getByText(/A recovery is already waiting for this account/)).toBeTruthy();
  });
});
