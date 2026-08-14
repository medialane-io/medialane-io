"use client";

import { withSiwsAuth } from "@/lib/pinata-fetch";

export async function pinLaunchpadMetadata(metadata: Record<string, unknown>, siwsToken: string): Promise<string> {
  const response = await fetch("/api/pinata/json", withSiwsAuth(siwsToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  }));
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.uri !== "string") {
    throw new Error("Couldn't save your details to IPFS. Please try again.");
  }
  return data.uri;
}

export async function pinSponsorshipTerms(metadata: Record<string, unknown>, siwsToken: string): Promise<string> {
  const response = await fetch("/api/pinata/sponsorship-terms", withSiwsAuth(siwsToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  }));
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.uri !== "string") {
    throw new Error("Couldn't save your terms. Please try again.");
  }
  return data.uri;
}
