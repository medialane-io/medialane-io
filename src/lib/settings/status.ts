import { formatDeadline, type RowTone } from "./rows";

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

function headline(input: StatusInput): StatusHeadline | null {
  const { email, walletDeployed } = input;
  if (email === null || walletDeployed === null) return null;
  if (!email.verified) {
    const when = email.deadline ? ` by ${formatDeadline(email.deadline, "long")}` : "";
    return { tone: "warn", text: `Confirm your email${when} to keep your account`, href: "/settings/email" };
  }
  if (!walletDeployed) return { tone: "muted", text: "Your wallet is still setting up" };
  if (input.guardians === 0) {
    return { tone: "warn", text: "Turn on recovery so you can always get your account back", href: "/settings/recovery" };
  }
  return { tone: "ok", text: "Everything is working" };
}

export function accountStatus(input: StatusInput): { headline: StatusHeadline | null; lines: StatusLine[] } {
  const { address, email, walletDeployed, devices, guardians } = input;

  const signin: StatusLine = {
    id: "signin",
    label: "Sign-in",
    value: email === null ? null : email.email,
    note: email?.email ? (email.verified ? { text: "Confirmed", tone: "ok" } : { text: "Not confirmed", tone: "warn" }) : undefined,
  };

  const wallet: StatusLine = {
    id: "wallet",
    label: "Wallet",
    value: address && walletDeployed !== null ? shortAddress(address) : null,
    note:
      walletDeployed === null ? undefined : walletDeployed ? { text: "Live onchain", tone: "ok" } : { text: "Setting up", tone: "muted" },
  };

  const deviceLine: StatusLine = {
    id: "devices",
    label: "Devices",
    value: devices === null ? null : `${devices} signing device${devices === 1 ? "" : "s"}`,
  };

  const recovery: StatusLine = {
    id: "recovery",
    label: "Recovery",
    value: guardians === null ? null : guardians > 0 ? "Guardian set" : "Not set up",
    action: guardians === 0 ? { label: "Set up", href: "/settings/recovery" } : undefined,
  };

  return { headline: headline(input), lines: [signin, wallet, deviceLine, recovery] };
}
