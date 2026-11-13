import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { mockForThisFile } from "../../../test/mock-for-this-file";

const WALLET = "0x071c174b93d24b72fc4b25e1d28fce1267e30c4c57fa4b0980a403a97fa84f5f";
const KEY = `medialane-recovery:v1:${WALLET}:0x01${"2b".repeat(31)}`;

let session: object | null = { id: "s" };
let owns = true;
const events: string[] = [];
let recoverCall: (proof: unknown) => Promise<unknown>;

await mockForThisFile("@medialane/ui/utils/use-session", { useSession: () => ({ session }) as never });
await mockForThisFile<typeof import("@/lib/wallet/passkey")>("@/lib/wallet/passkey", () => ({
  sealImportedOwnerKey: async () => {
    events.push("sealed");
    return { address: WALLET, ownerPubKey: "0xpub" } as never;
  },
}) as never);
await mockForThisFile<typeof import("@/lib/wallet/devices")>("@/lib/wallet/devices", () => ({
  isOwnerOf: async () => owns,
}) as never);
await mockForThisFile<typeof import("@/lib/wallet/store")>("@/lib/wallet/store", () => ({
  saveSealedOwner: () => events.push("saved"),
  notifyWalletChange: () => events.push("notified"),
}) as never);
await mockForThisFile<typeof import("@/lib/medialane-client")>("@/lib/medialane-client", () => ({
  getMedialaneClient: () => ({ api: { account: { recoverWalletWithKey: (proof: unknown) => recoverCall(proof) } } }),
}) as never);

const { RecoverWalletDialog } = await import("./recover-wallet-dialog");

const siwsMessage = {
  domain: { name: "Medialane", version: "1", chainId: "SN_MAIN", revision: "1" },
  primaryType: "SiwsMessage",
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    SiwsMessage: [
      { name: "wallet", type: "ContractAddress" },
      { name: "nonce", type: "shortstring" },
      { name: "app", type: "shortstring" },
    ],
  },
  message: { wallet: WALLET, nonce: "abc123", app: "medialane" },
};
const realFetch = globalThis.fetch;

const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });

beforeEach(() => {
  globalThis.fetch = (async (url: string) => {
    events.push(url.endsWith("/v1/auth/siws/nonce") ? "proof" : "other-request");
    return Response.json({ nonce: "abc123", typedData: siwsMessage });
  }) as unknown as typeof fetch;
  session = { id: "s" };
  owns = true;
  events.length = 0;
  recoverCall = async () => {
    events.push("recovered");
    return { walletAddress: WALLET };
  };
});
afterEach(() => {
  cleanup();
  globalThis.fetch = realFetch;
});

describe("the recover with your key dialog", () => {
  test("recovering stays disabled until the key reads as a recovery key", () => {
    const { getByLabelText, getByText } = render(<RecoverWalletDialog open onOpenChange={() => {}} />);
    expect((getByText("Recover wallet") as HTMLButtonElement).disabled).toBe(true);
    type(getByLabelText("Recovery key"), "not a key");
    expect((getByText("Recover wallet") as HTMLButtonElement).disabled).toBe(true);
    type(getByLabelText("Recovery key"), KEY);
    expect((getByText("Recover wallet") as HTMLButtonElement).disabled).toBe(false);
  });

  test("the account is updated before the browser switches wallets, and Done refreshes the page", async () => {
    const reloads: number[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, reload: () => reloads.push(1) } });
    const { getByLabelText, getByText, getAllByText } = render(<RecoverWalletDialog open onOpenChange={() => {}} />);
    type(getByLabelText("Recovery key"), KEY);
    fireEvent.click(getByText("Recover wallet"));
    await waitFor(() => expect(getByText("Wallet recovered")).toBeTruthy());
    expect(events).toEqual(["sealed", "proof", "recovered", "saved", "notified"]);
    expect(getAllByText("Account secured with the recovered wallet").length).toBeGreaterThan(0);
    expect(reloads).toEqual([]);
    fireEvent.click(getByText("Done"));
    expect(reloads).toEqual([1]);
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  test("a key that does not open the wallet changes nothing", async () => {
    owns = false;
    const { getByLabelText, getByText, getByRole } = render(<RecoverWalletDialog open onOpenChange={() => {}} />);
    type(getByLabelText("Recovery key"), KEY);
    fireEvent.click(getByText("Recover wallet"));
    await waitFor(() => expect(getByRole("alert")).toBeTruthy());
    expect(events).toEqual(["sealed"]);
  });

  test("when the account cannot be updated the browser keeps its wallet", async () => {
    recoverCall = async () => {
      throw new Error("Account refused");
    };
    const { getByLabelText, getByText, getByRole } = render(<RecoverWalletDialog open onOpenChange={() => {}} />);
    type(getByLabelText("Recovery key"), KEY);
    fireEvent.click(getByText("Recover wallet"));
    await waitFor(() => expect(getByRole("alert")).toBeTruthy());
    expect(events).toEqual(["sealed", "proof"]);
  });

  test("without a session it asks to sign in and starts nothing", async () => {
    session = null;
    const { getByLabelText, getByText } = render(<RecoverWalletDialog open onOpenChange={() => {}} />);
    type(getByLabelText("Recovery key"), KEY);
    fireEvent.click(getByText("Recover wallet"));
    await waitFor(() => expect(getByText("Sign in to recover a wallet.")).toBeTruthy());
    expect(events).toEqual([]);
  });
});
