"use client";

// Pins metadata JSON to IPFS and returns its ipfs:// URI. This URI is embedded
// as base_uri in an immutable collection-deploy tx, so a failure MUST throw —
// never return a falsy fallback that would ship an empty base_uri. Callers run
// inside the write pipeline, which surfaces the thrown message.
export async function pinLaunchpadMetadata(metadata: Record<string, unknown>): Promise<string> {
  const response = await fetch("/api/pinata/json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.uri !== "string") {
    throw new Error("Couldn't save your details to IPFS. Please try again.");
  }
  return data.uri;
}

/** Same shape as `pinLaunchpadMetadata`, but for `@medialane/ui`'s
 *  `toLicenseMetadata()` sponsorship-terms document — `/api/pinata/json`'s
 *  field allowlist is scoped to NFT metadata and rejects this shape. */
export async function pinSponsorshipTerms(metadata: Record<string, unknown>): Promise<string> {
  const response = await fetch("/api/pinata/sponsorship-terms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(metadata),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.uri !== "string") {
    throw new Error("Couldn't save your terms. Please try again.");
  }
  return data.uri;
}
