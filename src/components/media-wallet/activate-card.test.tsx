import { afterEach, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register({ url: "http://localhost:3000" });

import { cleanup, render } from "@testing-library/react";
import { ActivateCard } from "./activate-card";

afterEach(() => cleanup());

const JARGON = [/permissionless/i, /self custody/i, /\bonchain\b/i];

test("activation copy contains no crypto jargon", () => {
  render(<ActivateCard onActivated={() => {}} />);
  const text = document.body.textContent ?? "";
  for (const pattern of JARGON) {
    expect(pattern.test(text)).toBe(false);
  }
});

test("activation copy still communicates the account is free and gas-sponsored", () => {
  const { getByText } = render(<ActivateCard onActivated={() => {}} />);
  expect(getByText(/no gas fees/i)).toBeTruthy();
});
