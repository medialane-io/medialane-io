import { afterEach, expect, test, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register({ url: "http://localhost:3000" });

mock.module("next/image", () => ({
  default: ({ src }: { src?: string }) => <div data-testid="avatar-image" data-src={src} />,
}));

mock.module("@/hooks/use-profiles", () => ({
  useCreatorProfile: () => ({ profile: { avatarImage: "ipfs://avatar" } }),
}));
mock.module("@/hooks/use-username-claims", () => ({
  useMyUsernameClaim: () => ({ username: "mochi", isLoading: false }),
}));

const { cleanup, render } = await import("@testing-library/react");
const { MediaWalletHeader } = await import("./media-wallet-header");

afterEach(() => cleanup());

test("shows the claimed username as the headline when one exists", () => {
  const { getByText, queryByText } = render(
    <MediaWalletHeader address="0x36a8000000000000000000000000000000000020d2" onNavigate={() => {}} />
  );
  expect(getByText("@mochi")).toBeTruthy();
  expect(queryByText(/0x36a8…20d2/i)).toBeNull();
});
