import { afterEach, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { MINT_COPY } from "@/app/mint/mint-content";
import { BR_MINT_COPY } from "@/app/br/mint/br-mint-content";
import { MintLanding } from "./mint-landing";

afterEach(() => cleanup());

test("renders every chip and eligibility line from the copy", () => {
  render(<MintLanding copy={BR_MINT_COPY} mint={null} />);
  for (const chip of BR_MINT_COPY.chips) expect(screen.getByText(chip)).toBeTruthy();
  for (const { text } of BR_MINT_COPY.eligibility.items) expect(screen.getByText(text)).toBeTruthy();
  expect(screen.getByText(BR_MINT_COPY.headline.highlight)).toBeTruthy();
});

test("renders the badge only when the copy has one", () => {
  render(<MintLanding copy={MINT_COPY} mint={null} />);
  expect(screen.getByText(MINT_COPY.badge!)).toBeTruthy();
  cleanup();
  render(<MintLanding copy={BR_MINT_COPY} mint={null} />);
  expect(BR_MINT_COPY.badge).toBeUndefined();
  expect(screen.queryByText("Creator's Fund Campaign")).toBeNull();
});

test("renders the mint slot", () => {
  render(<MintLanding copy={MINT_COPY} mint={<button>mint slot</button>} />);
  expect(screen.getByRole("button", { name: "mint slot" })).toBeTruthy();
});
