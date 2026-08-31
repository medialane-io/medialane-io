import { test, expect } from "bun:test";
import { relevanceFilter } from "@medialane/ui";
import { NAV_COMMANDS } from "./nav-commands";

const items = NAV_COMMANDS.flatMap((group) => group.items);

function ranked(query: string) {
  return items
    .map((item) => ({
      label: item.label,
      score: relevanceFilter([item.label, ...(item.keywords ?? [])].join(" "), query),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.label);
}

test("searching for settings offers account settings and nothing else", () => {
  expect(ranked("settings")).toEqual(["Account Settings"]);
});

test("a coincidental letter subsequence is not a result", () => {
  // "settings" appears letter-by-letter inside "sell ... trade ... listings",
  // which is why Marketplace once ranked above the page actually named Settings.
  const marketplace = items.find((i) => i.label === "Marketplace")!;
  const value = [marketplace.label, ...(marketplace.keywords ?? [])].join(" ");
  expect(relevanceFilter(value, "settings")).toBe(0);
});

test("the intended destination ranks first while the query is still being typed", () => {
  const journeys: [string[], string][] = [
    [["set", "sett", "setti", "settings"], "Account Settings"],
    [["air", "aird", "airdrop"], "Airdrop"],
    [["portf", "portfo", "portfolio"], "Portfolio"],
    [["club"], "Create IP Club"],
    [["coins"], "Coins"],
  ];
  for (const [prefixes, expected] of journeys) {
    for (const prefix of prefixes) {
      expect({ prefix, top: ranked(prefix)[0] }).toEqual({ prefix, top: expected });
    }
  }
});

test("every command is reachable by typing its own label", () => {
  for (const item of items) {
    expect({ label: item.label, found: ranked(item.label).includes(item.label) }).toEqual({
      label: item.label,
      found: true,
    });
  }
});

test("command ids are unique, so results cannot collide", () => {
  const ids = items.map((i) => i.id);
  expect(new Set(ids).size).toBe(ids.length);
});
