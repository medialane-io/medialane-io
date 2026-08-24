import { afterEach, expect, test, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register({ url: "http://localhost:3000" });

mock.module("next/image", () => ({
  default: ({ src, alt }: { src?: string; alt?: string }) => <div data-testid="asset-image" data-src={src} data-alt={alt} />,
}));

const { cleanup, render } = await import("@testing-library/react");
const { NftStrip } = await import("./nft-strip");
import type { NftItem } from "./nft-items";

afterEach(() => cleanup());

const ITEM: NftItem = {
  key: "0xabc-1",
  href: "/asset/starknet/0xabc/1",
  name: "Test Asset",
  image: "ipfs://image",
  ipType: "Art",
  fallbackId: "1",
};

test("renders an image tile per item, named via title/alt for accessibility", () => {
  const { container, getByTitle } = render(<NftStrip items={[ITEM]} isLoading={false} />);
  expect(getByTitle("Test Asset")).toBeTruthy();
  expect(container.querySelector('[data-testid="asset-image"]')?.getAttribute("data-alt")).toBe("Test Asset");
});

test("falls back to a generic icon when the item has no image", () => {
  const { getByTitle, container } = render(
    <NftStrip items={[{ ...ITEM, image: null }]} isLoading={false} />
  );
  expect(getByTitle("Test Asset")).toBeTruthy();
  expect(container.querySelector("svg")).toBeTruthy();
  expect(container.querySelector('[data-testid="asset-image"]')).toBeNull();
});

test("shows an empty state when there are no items and nothing is loading", () => {
  const { getByText } = render(<NftStrip items={[]} isLoading={false} />);
  expect(getByText(/no nfts yet/i)).toBeTruthy();
});

test("shows a loading skeleton instead of the empty message while loading", () => {
  const { queryByText, getByTestId } = render(<NftStrip items={[]} isLoading={true} />);
  expect(queryByText(/no nfts yet/i)).toBeNull();
  expect(getByTestId("nft-strip-skeleton")).toBeTruthy();
});
