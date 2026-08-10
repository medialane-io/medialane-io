import { afterEach, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

import { cleanup, render, within } from "@testing-library/react";
import { ValuePropCarousel } from "./value-prop-carousel";

afterEach(() => cleanup());

const LABELS = [
  "Own your work",
  "Create freely",
  "Get rewarded",
  "Sign in with a glance",
  "Free to mint",
  "Self custody",
  "Global markets",
  "Immutable contracts",
  "Worldwide protection",
  "Censorship resistant",
  "Sponsored transactions",
  "Remix",
  "Limited editions",
  "Creator's Fund",
  "Asset provenance",
  "Creator Launchpad",
  "NFT Marketplace",
];

test("renders all 17 value props in the primary track", () => {
  const { getByTestId } = render(<ValuePropCarousel />);
  const primary = getByTestId("value-prop-track-primary");
  for (const label of LABELS) {
    expect(within(primary).getByText(label)).toBeTruthy();
  }
});

test("duplicates the track for a seamless loop", () => {
  const { getAllByText } = render(<ValuePropCarousel />);
  expect(getAllByText("Own your work")).toHaveLength(2);
});

test("marks the duplicate track aria-hidden so screen readers don't double-announce it", () => {
  const { container } = render(<ValuePropCarousel />);
  // Scope to a <div aria-hidden> specifically — lucide icons render their
  // own aria-hidden <svg>, which a bare `[aria-hidden="true"]` selector
  // would match first instead of the intended duplicate track wrapper.
  const hidden = container.querySelector('div[aria-hidden="true"]');
  expect(hidden).toBeTruthy();
  expect(within(hidden as HTMLElement).getByText("Own your work")).toBeTruthy();
});
