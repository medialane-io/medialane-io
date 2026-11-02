import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createFakeMarketplaceTransaction } from "../../../test/fake-marketplace-transaction";

const real = {
  tx: { ...(await import("@/hooks/use-marketplace-transaction")) },
  intents: { ...(await import("@/lib/marketplace-intents")) },
  session: { ...(await import("@/hooks/use-wallet-native-session")) },
  standard: { ...(await import("@/hooks/use-resolved-token-standard")) },
};

// Module mocks outlive this file in bun, so every fake hands back to the real one once this file is done.
let active = false;
const { control: fake, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();
const transfers: unknown[] = [];

mock.module("@/hooks/use-marketplace-transaction", () => ({
  ...real.tx,
  useMarketplaceTransaction: (...args: Parameters<typeof real.tx.useMarketplaceTransaction>) =>
    (active ? useFakeMarketplaceTransaction : real.tx.useMarketplaceTransaction)(...args),
}));
mock.module("@/lib/marketplace-intents", () => ({
  ...real.intents,
  transferNft: async (...args: Parameters<typeof real.intents.transferNft>) => {
    if (!active) return real.intents.transferNft(...args);
    transfers.push(args[1]);
    return "0xtx";
  },
}));
mock.module("@/hooks/use-wallet-native-session", () => ({
  ...real.session,
  useWalletNativeSession: () =>
    active ? { address: "0xabc", hasWallet: true, isDeployed: true, signer: null } : real.session.useWalletNativeSession(),
}));
mock.module("@/hooks/use-resolved-token-standard", () => ({
  ...real.standard,
  useResolvedTokenStandard: (contract: string | null, standard?: string | null) =>
    active
      ? { tokenStandard: "ERC721", collectionStandard: "ERC721", isResolving: false }
      : real.standard.useResolvedTokenStandard(contract, standard),
}));

const { TransferDialog } = await import("./transfer-dialog");

beforeAll(() => { active = true; });
afterAll(() => { active = false; });
afterEach(() => {
  cleanup();
  fake.clear();
  transfers.length = 0;
});

function show(onOpenChange: (v: boolean) => void = () => {}) {
  render(<TransferDialog open onOpenChange={onOpenChange} contractAddress="0xc" tokenId="1" tokenStandard="ERC721" />);
}

async function confirmTransfer(to: string) {
  fireEvent.change(screen.getByPlaceholderText("0x…"), { target: { value: to } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Transfer$/ })); });
  await screen.findByText("Transfer this asset? This action cannot be undone.");
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: /^Transfer$/ })); });
  await waitFor(() => expect(fake.started).toBe(1));
}

describe("TransferDialog", () => {
  test("confirming sends the token to the recipient", async () => {
    fake.runWork = true;
    show();
    await confirmTransfer("0x123");
    expect(transfers).toEqual([{ contractAddress: "0xc", tokenId: "1", toAddress: "0x123", tokenStandard: "ERC721" }]);
    await screen.findByRole("button", { name: "Done" });
  });

  test("Done on the success screen closes the dialog", async () => {
    let closed = 0;
    show((v) => { if (!v) closed++; });
    await confirmTransfer("0x123");
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));
    expect(closed).toBe(1);
  });

  test("a failure after submit shows the error screen, and Try again returns to the form", async () => {
    fake.fail = { message: "Reverted", retryable: true, submitted: true };
    show();
    await confirmTransfer("0x123");
    await screen.findByText("Reverted");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(fake.resets).toBeGreaterThan(0);
    await screen.findByPlaceholderText("0x…");
  });

  test("a failure before submit stays on the confirm step with the error", async () => {
    fake.fail = { message: "Passkey prompt closed", retryable: true, submitted: false };
    show();
    await confirmTransfer("0x123");
    await screen.findByText("Passkey prompt closed");
    expect(screen.queryByText("Transfer this asset? This action cannot be undone.") !== null).toBe(true);
  });

  test("close is ignored while busy", async () => {
    fake.hang = true;
    let closes = 0;
    show(() => { closes++; });
    await confirmTransfer("0x123");
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    expect(closes).toBe(0);
  });
});
