import { afterEach, describe, expect, test } from "bun:test";
import { useEffect } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { mockForThisFile } from "../../../../test/mock-for-this-file";

let hasWallet = true;
const mounts: string[] = [];

await mockForThisFile("@/hooks/use-wallet-native-session", {
  useWalletNativeSession: () => ({ address: hasWallet ? "0xabc" : null, hasWallet }) as never,
});
await mockForThisFile("@/components/settings/recovery-section", { RecoverySection: () => null });
await mockForThisFile("@/components/wallet/recover-wallet-dialog", {
  RecoverWalletDialog: ({ open }: { open: boolean }) => {
    useEffect(() => {
      mounts.push("mounted");
      return () => {
        mounts.push("unmounted");
      };
    }, []);
    return open ? <p>recover dialog</p> : null;
  },
});

const { default: RecoverySettingsPage } = await import("./recovery-page");

afterEach(() => {
  cleanup();
  hasWallet = true;
  mounts.length = 0;
});

describe("the recovery page", () => {
  test("the recover dialog stays open when the browser's wallet no longer matches the account's", () => {
    const { getByText, rerender, queryByText } = render(<RecoverySettingsPage />);
    fireEvent.click(getByText("Enter recovery key"));
    expect(getByText("recover dialog")).toBeTruthy();
    hasWallet = false;
    rerender(<RecoverySettingsPage />);
    expect(queryByText("Secure your account")).toBeTruthy();
    expect(getByText("recover dialog")).toBeTruthy();
    expect(mounts).toEqual(["mounted"]);
  });
});
