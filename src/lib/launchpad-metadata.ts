"use client";

export async function pinLaunchpadMetadata(metadata: Record<string, unknown>): Promise<string | null> {
  try {
    const response = await fetch("/api/pinata/json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata),
    });
    const data = await response.json();
    return typeof data?.uri === "string" ? data.uri : null;
  } catch {
    return null;
  }
}
