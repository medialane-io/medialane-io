import { describe, expect, test } from "bun:test";
import { accountTitle, emailBannerText, emailRow, formatDeadline, legacySettingsPath, usernameRow, walletRow } from "./rows";

describe("the email row", () => {
  test("shows nothing while the status is still loading", () => {
    expect(emailRow(null)).toBeNull();
  });

  test("warns when the email is not confirmed yet", () => {
    expect(emailRow({ email: "a@b.co", verified: false })).toEqual({ value: "Not confirmed", tone: "warn" });
  });

  test("names the date when there is a deadline, short enough for a row", () => {
    expect(emailRow({ email: "a@b.co", verified: false, deadline: "2026-10-10T12:00:00.000Z" })).toEqual({
      value: "Confirm by 10 Oct",
      tone: "warn",
    });
  });

  test("a confirmed email ignores any deadline", () => {
    expect(emailRow({ email: "a@b.co", verified: true, deadline: "2026-10-10T12:00:00.000Z" })).toEqual({ value: "Confirmed", tone: "ok" });
  });

  test("is calm once the email is confirmed", () => {
    expect(emailRow({ email: "a@b.co", verified: true })).toEqual({ value: "Confirmed", tone: "ok" });
  });
});

describe("the wallet row", () => {
  test("only speaks up while the wallet is still being set up", () => {
    expect(walletRow(false)).toEqual({ value: "Setting up", tone: "warn" });
  });

  test("says nothing when the wallet is ready or still being checked", () => {
    expect(walletRow(true)).toBeUndefined();
    expect(walletRow(null)).toBeUndefined();
  });
});

describe("the username row", () => {
  test("shows the handle once it is approved", () => {
    expect(usernameRow("ada", null)).toEqual({ value: "@ada", tone: "ok" });
  });

  test("tells a pending or rejected claim apart", () => {
    expect(usernameRow(null, "PENDING")).toEqual({ value: "Under review", tone: "muted" });
    expect(usernameRow(null, "REJECTED")).toEqual({ value: "Rejected", tone: "warn" });
  });

  test("says nothing when there is no claim at all", () => {
    expect(usernameRow(null, null)).toBeUndefined();
  });

  test("an approved handle wins over an older claim record", () => {
    expect(usernameRow("ada", "REJECTED")).toEqual({ value: "@ada", tone: "ok" });
  });
});

describe("the account title", () => {
  test("is the name when there is one", () => {
    expect(accountTitle("Ada", "a@b.co")).toBe("Ada");
  });

  test("falls back to the email, then to a plain label, never a prompt", () => {
    expect(accountTitle(null, "a@b.co")).toBe("a@b.co");
    expect(accountTitle("", "a@b.co")).toBe("a@b.co");
    expect(accountTitle(undefined, null)).toBe("Your account");
  });
});

describe("links to the old tabbed settings", () => {
  test("the account tab now lives on the email page and the profile tab on the profile page", () => {
    expect(legacySettingsPath("account")).toBe("/settings/email");
    expect(legacySettingsPath("profile")).toBe("/settings/profile");
  });

  test("anything else stays on the settings home", () => {
    expect(legacySettingsPath(undefined)).toBeNull();
    expect(legacySettingsPath("")).toBeNull();
    expect(legacySettingsPath("nonsense")).toBeNull();
  });
});

describe("writing a deadline as a date", () => {
  test("is a plain date in UTC, short or long", () => {
    expect(formatDeadline("2026-10-10T23:59:00.000Z", "short")).toBe("10 Oct");
    expect(formatDeadline("2026-10-10T23:59:00.000Z", "long")).toBe("10 October");
  });
});

describe("the line under 'Verify your email' in the wallet panel", () => {
  test("names the date when there is one", () => {
    expect(emailBannerText("2026-10-10T12:00:00.000Z")).toBe("Confirm by 10 October to keep your account");
  });

  test("falls back to the general reason when there is no date", () => {
    expect(emailBannerText(null)).toBe("Validate to access all the platform features");
    expect(emailBannerText(undefined)).toBe("Validate to access all the platform features");
  });
});
