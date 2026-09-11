"use client";

async function pinJson(metadata: Record<string, unknown>, failureMessage: string): Promise<string> {
  const response = await fetch("/api/proxy/v1/metadata/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  const body = (await response.json().catch(() => ({}))) as {
    data?: { url?: string };
    error?: string;
  };
  const uri = body.data?.url;
  if (!response.ok || typeof uri !== "string") {
    throw new Error(failureMessage);
  }
  return uri;
}

export async function pinLaunchpadMetadata(metadata: Record<string, unknown>): Promise<string> {
  return pinJson(metadata, "Couldn't save your details to IPFS. Please try again.");
}

export async function pinSponsorshipTerms(metadata: Record<string, unknown>): Promise<string> {
  return pinJson(metadata, "Couldn't save your terms. Please try again.");
}
