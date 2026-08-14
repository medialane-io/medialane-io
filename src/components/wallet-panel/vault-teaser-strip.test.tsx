import { afterEach, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

import { cleanup, render, fireEvent } from "@testing-library/react";
import { VaultTeaserStrip } from "./vault-teaser-strip";
import type { VaultTeaserItem } from "./vault-teaser-items";

afterEach(() => cleanup());

const ITEM: VaultTeaserItem = {
  key: "0xabc-1",
  href: "/asset/starknet/0xabc/1",
  name: "Test Asset",
  image: "ipfs://image",
  ipType: "Art",
  fallbackId: "1",
};

test("renders one card per item", () => {
  const { getByText } = render(<VaultTeaserStrip items={[ITEM]} isLoading={false} onViewVault={() => {}} />);
  expect(getByText("Test Asset")).toBeTruthy();
});

test("shows an empty-vault message when there are no items and nothing is loading", () => {
  const { getByText } = render(<VaultTeaserStrip items={[]} isLoading={false} onViewVault={() => {}} />);
  expect(getByText(/nothing in your vault yet/i)).toBeTruthy();
});

test("shows a loading skeleton instead of the empty message while loading", () => {
  const { queryByText, getByTestId } = render(<VaultTeaserStrip items={[]} isLoading={true} onViewVault={() => {}} />);
  expect(queryByText(/nothing in your vault yet/i)).toBeNull();
  expect(getByTestId("vault-teaser-skeleton")).toBeTruthy();
});

test("calls onViewVault when the View vault link is clicked", () => {
  let called = false;
  const { getByText } = render(<VaultTeaserStrip items={[ITEM]} isLoading={false} onViewVault={() => { called = true; }} />);
  fireEvent.click(getByText(/view vault/i));
  expect(called).toBe(true);
});
