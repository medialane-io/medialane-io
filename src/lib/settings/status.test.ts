import { describe, expect, test } from "bun:test";
import { accountStatus, type StatusInput } from "./status";

const ADDRESS = "0x01575d29b83d7828cd1d833ef785083b809adeb187b6ac14aab21db568f2bf02";
const working: StatusInput = {
  address: ADDRESS,
  email: { email: "a@b.co", verified: true },
  walletDeployed: true,
  devices: 2,
  guardians: 1,
};
const line = (input: StatusInput, id: string) => accountStatus(input).lines.find((l) => l.id === id)!;

describe("the headline", () => {
  test("reassures when the account is working", () => {
    expect(accountStatus(working).headline).toEqual({ tone: "ok", text: "Everything is working" });
  });

  test("asks to confirm the email, and links to where, when it is not confirmed", () => {
    const h = accountStatus({ ...working, email: { email: "a@b.co", verified: false } }).headline;
    expect(h).toEqual({ tone: "warn", text: "Confirm your email to keep your account", href: "/settings/email" });
  });

  test("names the date in the headline when there is a deadline", () => {
    const h = accountStatus({ ...working, email: { email: "a@b.co", verified: false, deadline: "2026-10-10T12:00:00.000Z" } }).headline;
    expect(h).toEqual({ tone: "warn", text: "Confirm your email by 10 October to keep your account", href: "/settings/email" });
  });

  test("says the wallet is still setting up, as a calm notice", () => {
    expect(accountStatus({ ...working, walletDeployed: false }).headline).toEqual({
      tone: "muted",
      text: "Your wallet is still setting up",
    });
  });

  test("the email matters more than the wallet when both need a look", () => {
    const h = accountStatus({ ...working, walletDeployed: false, email: { email: "a@b.co", verified: false } }).headline;
    expect(h?.text).toBe("Confirm your email to keep your account");
  });

  test("an account with no recovery or a single device is still working", () => {
    expect(accountStatus({ ...working, guardians: 0, devices: 1 }).headline?.tone).toBe("ok");
  });

  test("shows nothing while the email or the wallet is still being checked", () => {
    expect(accountStatus({ ...working, email: null }).headline).toBeNull();
    expect(accountStatus({ ...working, walletDeployed: null }).headline).toBeNull();
  });
});

describe("the lines", () => {
  test("sign-in shows the email and whether it is confirmed", () => {
    expect(line(working, "signin")).toMatchObject({ value: "a@b.co", note: { text: "Confirmed", tone: "ok" } });
    expect(line({ ...working, email: { email: "a@b.co", verified: false } }, "signin").note).toEqual({ text: "Not confirmed", tone: "warn" });
  });

  test("wallet shows a short address and its state", () => {
    expect(line(working, "wallet")).toMatchObject({ value: "0x0157…bf02", note: { text: "Live onchain", tone: "ok" } });
    expect(line({ ...working, walletDeployed: false }, "wallet").note).toEqual({ text: "Setting up", tone: "muted" });
  });

  test("devices counts them in plain words", () => {
    expect(line(working, "devices").value).toBe("2 signing devices");
    expect(line({ ...working, devices: 1 }, "devices").value).toBe("1 signing device");
  });

  test("recovery is plain information, with a quiet link only when it is not set up", () => {
    expect(line(working, "recovery")).toMatchObject({ value: "Guardian set" });
    expect(line(working, "recovery").action).toBeUndefined();
    expect(line({ ...working, guardians: 0 }, "recovery")).toMatchObject({
      value: "Not set up",
      action: { label: "Set up", href: "/settings/recovery" },
    });
  });

  test("lines still loading have no value yet", () => {
    const loading = accountStatus({ address: ADDRESS, email: null, walletDeployed: null, devices: null, guardians: null });
    expect(loading.lines.every((l) => l.value === null)).toBe(true);
  });
});
