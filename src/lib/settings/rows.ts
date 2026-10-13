export type RowTone = "ok" | "warn" | "muted";

export interface RowStatus {
  value: string;
  tone: RowTone;
}

export function formatDeadline(iso: string, style: "short" | "long"): string {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: style === "short" ? "short" : "long" });
}

export function emailRow(status: { email: string; verified: boolean; deadline?: string | null } | null): RowStatus | null {
  if (!status) return null;
  if (status.verified) return { value: "Confirmed", tone: "ok" };
  return { value: status.deadline ? `Confirm by ${formatDeadline(status.deadline, "short")}` : "Not confirmed", tone: "warn" };
}

export function walletRow(isDeployed: boolean | null): RowStatus | undefined {
  return isDeployed === false ? { value: "Setting up", tone: "warn" } : undefined;
}

export function usernameRow(approved: string | null, claimStatus: string | null): RowStatus | undefined {
  if (approved) return { value: `@${approved}`, tone: "ok" };
  if (claimStatus === "PENDING") return { value: "Under review", tone: "muted" };
  if (claimStatus === "REJECTED") return { value: "Rejected", tone: "warn" };
  return undefined;
}

export function accountTitle(name: string | null | undefined, email: string | null | undefined): string {
  return name || email || "Your account";
}

export const emailBannerText = (deadline: string | null | undefined): string =>
  deadline ? `Confirm by ${formatDeadline(deadline, "long")} to keep your account` : "Validate to access all the platform features";

const LEGACY_TABS: Record<string, string> = {
  account: "/settings/email",
  profile: "/settings/profile",
};

export function legacySettingsPath(tab: string | null | undefined): string | null {
  return (tab && LEGACY_TABS[tab]) || null;
}
