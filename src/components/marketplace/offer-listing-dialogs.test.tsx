import { afterAll, afterEach, beforeAll, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createFakeMarketplaceTransaction } from "../../../test/fake-marketplace-transaction";

const real = {
  tx: { ...(await import("@/hooks/use-marketplace-transaction")) },
  session: { ...(await import("@/hooks/use-wallet-native-session")) },
  standard: { ...(await import("@/hooks/use-resolved-token-standard")) },
  balance: { ...(await import("@medialane/ui/utils/media-wallet/use-erc20-balance")) },
  usd: { ...(await import("@/hooks/use-usd-prices")) },
  nav: { ...(await import("next/navigation")) },
};

// Module mocks outlive this file in bun, so every fake hands back to the real hook once this file is done.
let active = false;
const { control: fake, useFakeMarketplaceTransaction } = createFakeMarketplaceTransaction();

mock.module("@/hooks/use-marketplace-transaction", () => ({
  ...real.tx,
  useMarketplaceTransaction: (...args: Parameters<typeof real.tx.useMarketplaceTransaction>) =>
    (active ? useFakeMarketplaceTransaction : real.tx.useMarketplaceTransaction)(...args),
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
mock.module("@medialane/ui/utils/media-wallet/use-erc20-balance", () => ({
  ...real.balance,
  useTokenBalance: (...args: Parameters<typeof real.balance.useTokenBalance>) =>
    active ? { rawBalance: null, decimals: 6, isLoading: false } : real.balance.useTokenBalance(...args),
}));
mock.module("@/hooks/use-usd-prices", () => ({
  ...real.usd,
  useUsdPrices: () => (active ? {} : real.usd.useUsdPrices()),
}));
mock.module("next/navigation", () => ({
  ...real.nav,
  usePathname: () => (active ? "/asset/starknet/0xc/1" : real.nav.usePathname()),
}));

const { MedialaneAppProvider } = await import("@medialane/ui");
const { OfferDialog } = await import("./offer-dialog");
const { ListingDialog } = await import("./listing-dialog");

beforeAll(() => { active = true; });
afterAll(() => { active = false; });
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
      fake.fail = { message: "Network hiccup", retryable: true };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Network hiccup");
      const resetsBefore = fake.resets;
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(fake.resets).toBe(resetsBefore + 1);
    });

    test("no Try again when the error is not retryable", async () => {
      fake.fail = { message: "Not allowed", retryable: false };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Not allowed");
      expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });

    test("a failure before submit returns to the form with values kept", async () => {
      fake.fail = { message: "Passkey prompt closed", retryable: true };
      show(dialog.render(() => {}));
      await submitPrice(dialog.submit, "5");
      await screen.findByText("Passkey prompt closed");
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect((await screen.findByPlaceholderText("0.00") as HTMLInputElement).value).toBe("5");
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
