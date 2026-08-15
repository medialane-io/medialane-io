import { afterEach, expect, test, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register({ url: "http://localhost:3000" });

// next/image triggers happy-dom's real network image loading in a DOM test
// environment, which hangs — render a plain <img> instead, same convention
// any next/image consumer test in this repo should follow.
mock.module("next/image", () => ({
  // A real <img src> makes happy-dom attempt to actually load the resource
  // over the network and hang the test — a data-only stand-in avoids that
  // while still letting assertions on surrounding text run.
  default: ({ src }: { src?: string }) => <div data-testid="avatar-image" data-src={src} />,
}));

mock.module("@/hooks/use-profiles", () => ({
  useCreatorProfile: () => ({ profile: null }),
}));
mock.module("@/hooks/use-username-claims", () => ({
  useMyUsernameClaim: () => ({ username: null, isLoading: false }),
}));
mock.module("@/hooks/use-rewards", () => ({
  useRewards: () => ({ data: undefined, isLoading: false }),
}));
mock.module("@/hooks/use-siws-token", () => ({
  useSiwsToken: () => ({ getValidToken: () => null, signIn: async () => null }),
}));

const { cleanup, render } = await import("@testing-library/react");
const { MediaWalletHeader } = await import("./media-wallet-header");

afterEach(() => cleanup());

test("shows the truncated address by default when no username is claimed", () => {
  const { getByText, queryByText } = render(
    <MediaWalletHeader address="0x36a8000000000000000000000000000000000020d2" onNavigate={() => {}} />
  );
  expect(getByText(/0x36a8…20d2/i)).toBeTruthy();
  expect(queryByText("Media Wallet")).toBeNull();
});
