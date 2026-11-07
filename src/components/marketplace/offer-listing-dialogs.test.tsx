import { afterEach, describe, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { mockForThisFile } from "../../../test/mock-for-this-file";
import { createFakeMarketplaceTransaction } from "../../../test/fake-marketplace-transaction";

const { control: fake, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();

await mockForThisFile("@/hooks/use-marketplace-transaction", { useMarketplaceTransaction: useFakeMarketplaceTransaction as never });
await mockForThisFile("@/hooks/use-wallet-native-session", {
  useWalletNativeSession: () => ({ address: "0xabc", hasWallet: true, isDeployed: true, signer: null }),
});
await mockForThisFile("@/hooks/use-resolved-token-standard", {
  useResolvedTokenStandard: () => ({ tokenStandard: "ERC721", collectionStandard: "ERC721", isResolving: false }),
});
await mockForThisFile("@medialane/ui/utils/media-wallet/use-erc20-balance", {
  useTokenBalance: () => ({ rawBalance: null, decimals: 6, isLoading: false }) as never,
});
await mockForThisFile("@medialane/ui/utils/use-usd-prices", { useUsdPrices: () => ({}) as never });
await mockForThisFile("next/navigation", { usePathname: () => "/asset/starknet/0xc/1" });

const { MedialaneAppProvider } = await import("@medialane/ui");
const { OfferDialog } = await import("./offer-dialog");
const { ListingDialog } = await import("./listing-dialog");

afterEach(() => {
  cleanup();
  fake.clear();
});

const DIALOGS: Array<{ name: string; submit: string; render: (onOpenChange: (v: boolean) => void) => ReactNode }> = [
  {
    name: "OfferDialog",
    submit: "Submit offer",
    render: (onOpenChange) => <OfferDialog open onOpenChange={onOpenChange} assetContract="0xc" tokenId="1" tokenStandard="ERC721" />,
  },
  {
    name: "ListingDialog",
    submit: "List",
    render: (onOpenChange) => <ListingDialog open onOpenChange={onOpenChange} assetContract="0xc" tokenId="1" tokenStandard="ERC721" />,
  },
];

const APP = {
  getClient: () => ({ api: {} }) as never,
  getSigner: () => { throw new Error("no signer in tests"); },
  walletAddress: "0xabc",
  onRequireWallet: () => {},
};
const show = (node: ReactNode) => render(<MedialaneAppProvider value={APP}>{node}</MedialaneAppProvider>);

async function submitPrice(submit: string, price: string) {
  fireEvent.change(screen.getByPlaceholderText("0.00"), { target: { value: price } });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${submit}$`) }));
  });
  await waitFor(() => expect(fake.started).toBe(1));
}

for (const dialog of DIALOGS) {
  describe(dialog.name, () => {
    test("Try again on the error screen calls reset", async () => {
      fake.fail = { message: "Network hiccup", retryable: true, submitted: true };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Network hiccup");
      const resetsBefore = fake.resets;
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(fake.resets).toBe(resetsBefore + 1);
    });

    test("no Try again when the error is not retryable", async () => {
      fake.fail = { message: "Not allowed", retryable: false, submitted: true };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Not allowed");
      expect(screen.queryByRole("button", { name: "Try again" }) === null).toBe(true);
    });

    test("a failure before submit stays on the form with the error and the values kept", async () => {
      fake.fail = { message: "Passkey prompt closed", retryable: true, submitted: false };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Passkey prompt closed");
      expect(screen.queryByRole("button", { name: "Try again" }) === null).toBe(true);
      expect((screen.getByPlaceholderText("0.00") as HTMLInputElement).value).toBe("5");
    });

    test("close is ignored while busy", async () => {
      fake.hang = true;
      let closes = 0;
      show(dialog.render(() => { closes++; }));
      await submitPrice(dialog.submit, "5");
      fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
      expect(closes).toBe(0);
    });
  });
}
