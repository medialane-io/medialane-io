import { test, expect } from "bun:test";
import type { ApiCollectionProfile } from "@medialane/sdk";
import { EMPTY_SETTINGS_FORM, applyProfile, toProfileInput } from "./collection-settings-form";

const PROFILE: ApiCollectionProfile = {
  contractAddress: "0x1",
  chain: "STARKNET",
  displayName: "Name",
  description: null,
  image: "ipfs://img",
  bannerImage: null,
  websiteUrl: "https://site",
  twitterUrl: null,
  discordUrl: null,
  telegramUrl: null,
  hasGatedContent: true,
  gatedContentTitle: "Members",
  slug: null,
  updatedBy: null,
  updatedAt: "2026-01-01T00:00:00Z",
};

test("empty fields are sent as null", () => {
  const input = toProfileInput({ ...EMPTY_SETTINGS_FORM, displayName: "Name" });
  expect(input).toEqual({
    displayName: "Name",
    description: null,
    image: null,
    bannerImage: null,
    websiteUrl: null,
    twitterUrl: null,
    discordUrl: null,
    telegramUrl: null,
    gatedContentTitle: null,
    gatedContentUrl: null,
    gatedContentType: null,
  });
});

test("gated fields are cleared when gating is off", () => {
  const input = toProfileInput({
    ...EMPTY_SETTINGS_FORM,
    gatedEnabled: false,
    gatedContentTitle: "Members",
    gatedContentUrl: "https://private",
    gatedContentType: "VIDEO",
  });
  expect(input.gatedContentTitle).toBeNull();
  expect(input.gatedContentUrl).toBeNull();
  expect(input.gatedContentType).toBeNull();
});

test("gated fields are kept when gating is on", () => {
  const input = toProfileInput({
    ...EMPTY_SETTINGS_FORM,
    gatedEnabled: true,
    gatedContentTitle: "Members",
    gatedContentUrl: "https://private",
    gatedContentType: "VIDEO",
  });
  expect(input.gatedContentTitle).toBe("Members");
  expect(input.gatedContentUrl).toBe("https://private");
  expect(input.gatedContentType).toBe("VIDEO");
});

test("an empty gated type is sent as null even when gating is on", () => {
  const input = toProfileInput({ ...EMPTY_SETTINGS_FORM, gatedEnabled: true, gatedContentTitle: "Members" });
  expect(input.gatedContentType).toBeNull();
});

test("applying a profile fills the form and turns nulls into empty strings", () => {
  const form = applyProfile(EMPTY_SETTINGS_FORM, PROFILE);
  expect(form.displayName).toBe("Name");
  expect(form.description).toBe("");
  expect(form.image).toBe("ipfs://img");
  expect(form.websiteUrl).toBe("https://site");
  expect(form.gatedEnabled).toBe(true);
  expect(form.gatedContentTitle).toBe("Members");
});

test("applying a profile keeps the gated link and type the owner has typed", () => {
  const typed = { ...EMPTY_SETTINGS_FORM, gatedContentUrl: "https://private", gatedContentType: "AUDIO" };
  const form = applyProfile(typed, PROFILE);
  expect(form.gatedContentUrl).toBe("https://private");
  expect(form.gatedContentType).toBe("AUDIO");
});
