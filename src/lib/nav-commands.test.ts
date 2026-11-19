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
  expect(ranked("settings")).toEqual(["Account settings"]);
});

test("a coincidental letter subsequence is not a result", () => {
  const marketplace = items.find((i) => i.label === "Marketplace")!;
  const value = [marketplace.label, ...(marketplace.keywords ?? [])].join(" ");
  expect(relevanceFilter(value, "settings")).toBe(0);
});

test("the intended destination ranks first while the query is still being typed", () => {
  const journeys: [string[], string][] = [
    [["set", "sett", "setti", "settings"], "Account settings"],
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

test("the IP type links sit under Navigate and there is no separate Explore group", () => {
  const headings = NAV_COMMANDS.map((group) => group.heading);
  expect(headings).not.toContain("Explore");
  const navigate = NAV_COMMANDS.find((group) => group.heading === "Navigate")!;
  const labels = navigate.items.map((item) => item.label);
  for (const type of ["Audio", "Art", "Video", "Photography", "Publications", "NFT"]) expect(labels).toContain(type);
});
