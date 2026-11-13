import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { mockForThisFile } from "../../../test/mock-for-this-file";

let session: object | null = { id: "s" };
let deploy: (onStep: (step: string) => void, options: { replace?: boolean }) => Promise<unknown>;
const calls: { replace?: boolean }[] = [];

await mockForThisFile("@medialane/ui/utils/use-session", { useSession: () => ({ session }) as never });
await mockForThisFile<typeof import("@/lib/wallet/client")>("@/lib/wallet/client", (real) => ({
  mediaWallet: {
    ...real.mediaWallet,
    completeDeployment: (onStep: (step: never) => void, options: { replace?: boolean }) => {
      calls.push(options);
      return deploy(onStep as never, options);
    },
  } as never,
}));

const { ReplaceWalletDialog } = await import("./replace-wallet-dialog");

beforeEach(() => {
  session = { id: "s" };
  calls.length = 0;
  deploy = async () => new Promise(() => {});
});
afterEach(cleanup);

describe("the replace wallet dialog", () => {
  test("states what replacing does and starts nothing until it is confirmed", () => {
    const { getAllByText } = render(<ReplaceWalletDialog open onOpenChange={() => {}} />);
    expect(getAllByText(/permanently replaces the active wallet/).length).toBeGreaterThan(0);
    expect(calls).toEqual([]);
  });

  test("confirming replaces the wallet and shows the step it is on", async () => {
    deploy = async (onStep) => {
      onStep("creating-passkey");
      return new Promise(() => {});
    };
    const { getByText } = render(<ReplaceWalletDialog open onOpenChange={() => {}} />);
    fireEvent.click(getByText("Generate new wallet"));
    await waitFor(() => expect(getByText("Creating passkey…")).toBeTruthy());
    expect(calls).toEqual([{ replace: true }]);
  });

  test("when the wallet is ready it shows the finish screen with the new address, and Done refreshes the page", async () => {
    const address = "0x" + "ab".repeat(32);
    deploy = async () => ({ sealed: { address } });
    const reloads: number[] = [];
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, reload: () => reloads.push(1) } });
    const { getByText, getAllByText } = render(<ReplaceWalletDialog open onOpenChange={() => {}} />);
    fireEvent.click(getByText("Generate new wallet"));
    await waitFor(() => expect(getByText("New wallet active")).toBeTruthy());
    expect(getAllByText("Account secured with a new contract onchain").length).toBeGreaterThan(0);
    expect(reloads).toEqual([]);
    fireEvent.click(getByText("Done"));
    expect(reloads).toEqual([1]);
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  test("a failure shows an error in the dialog and allows trying again", async () => {
    deploy = async () => {
      throw new Error("Deploy refused");
    };
    const { getByText, getByRole } = render(<ReplaceWalletDialog open onOpenChange={() => {}} />);
    fireEvent.click(getByText("Generate new wallet"));
    await waitFor(() => expect(getByRole("alert")).toBeTruthy());
    expect(getByText("Generate new wallet")).toBeTruthy();
  });

  test("without a session it asks to sign in and starts nothing", async () => {
    session = null;
    const { getByText } = render(<ReplaceWalletDialog open onOpenChange={() => {}} />);
    fireEvent.click(getByText("Generate new wallet"));
    await waitFor(() => expect(getByText("Sign in to generate a wallet.")).toBeTruthy());
    expect(calls).toEqual([]);
  });
});
