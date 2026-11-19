import { formatDeadline, type RowTone } from "./rows";
import { plainT, type T } from "@medialane/ui/i18n";

export interface StatusInput {
  address: string | null;
  email: { email: string; verified: boolean; deadline?: string | null } | null;
  walletDeployed: boolean | null;
  devices: number | null;
  guardians: number | null;
}

export interface StatusHeadline {
  tone: RowTone;
  text: string;
  href?: string;
}

export interface StatusLine {
  id: "signin" | "wallet" | "devices" | "recovery";
  label: string;
  value: string | null;
  note?: { text: string; tone: RowTone };
  action?: { label: string; href: string };
}

const shortAddress = (a: string): string => `${a.slice(0, 6)}…${a.slice(-4)}`;

function headline(input: StatusInput, t: T): StatusHeadline | null {
  const { email, walletDeployed } = input;
  if (email === null || walletDeployed === null) return null;
  if (!email.verified) {
    const text = email.deadline
      ? t("Confirm your email by {deadline} to keep your account", { deadline: formatDeadline(email.deadline, "long") })
      : t("Confirm your email to keep your account");
    return { tone: "warn", text, href: "/settings/email" };
  }
  if (!walletDeployed) return { tone: "muted", text: t("Your wallet is still setting up") };
  return { tone: "ok", text: t("Everything is working") };
}

export function accountStatus(input: StatusInput, t: T = plainT): { headline: StatusHeadline | null; lines: StatusLine[] } {
  const { address, email, walletDeployed, devices, guardians } = input;

  const signin: StatusLine = {
    id: "signin",
    label: t("Sign-in"),
    value: email === null ? null : email.email,
    note: email?.email ? (email.verified ? { text: t("Confirmed"), tone: "ok" } : { text: t("Not confirmed"), tone: "warn" }) : undefined,
  };

  const wallet: StatusLine = {
    id: "wallet",
    label: t("Wallet"),
    value: address && walletDeployed !== null ? shortAddress(address) : null,
    note:
      walletDeployed === null ? undefined : walletDeployed ? { text: t("Live onchain"), tone: "ok" } : { text: t("Setting up"), tone: "muted" },
  };

  const deviceLine: StatusLine = {
    id: "devices",
    label: t("Devices"),
    value: devices === null ? null : t.plural("{count} signing device", "{count} signing devices", devices),
  };

  const recovery: StatusLine = {
    id: "recovery",
    label: t("Recovery"),
    value: guardians === null ? null : guardians > 0 ? t("Guardian set") : t("Not set up"),
    action: guardians === 0 ? { label: t("Set up"), href: "/settings/recovery" } : undefined,
  };

  return { headline: headline(input, t), lines: [signin, wallet, deviceLine, recovery] };
}
