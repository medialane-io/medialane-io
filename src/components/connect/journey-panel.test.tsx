import { afterEach, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
if (!GlobalRegistrator.isRegistered) GlobalRegistrator.register();

import { cleanup, render } from "@testing-library/react";
import type { ApiRewardsConfig } from "@medialane/sdk";

type MockRewardsState = { data: ApiRewardsConfig | undefined; isLoading: boolean };

let mockState: MockRewardsState = { data: undefined, isLoading: true };
mock.module("@/hooks/use-rewards", () => ({
  useRewardsConfig: () => mockState,
}));

const { JourneyPanel } = await import("./journey-panel");

afterEach(() => cleanup());

const CONFIG: ApiRewardsConfig = {
  levels: [
    { level: 1, name: "Starter", xpRequired: 0, badgeColor: "#6366f1", description: null },
    { level: 2, name: "Explorer", xpRequired: 100, badgeColor: "#22c55e", description: null },
  ],
  actions: [],
  badges: [],
};

test("renders a skeleton while loading", () => {
  mockState = { data: undefined, isLoading: true };
  const { container } = render(<JourneyPanel />);
  expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
});

test("renders the real first level and the ladder on success", () => {
  mockState = { data: CONFIG, isLoading: false };
  const { container, getByText } = render(<JourneyPanel />);
  expect(container.textContent).toContain("Starter");
  expect(container.textContent).toContain("Explorer");
  expect(getByText("Every creator starts here.")).toBeTruthy();
});

test("falls back to a plain icon when there is no level data", () => {
  mockState = { data: undefined, isLoading: false };
  const { container, queryByText } = render(<JourneyPanel />);
  expect(queryByText("Every creator starts here.")).toBeNull();
  expect(container.querySelector("svg")).toBeTruthy();
});
