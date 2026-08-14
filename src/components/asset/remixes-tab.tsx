"use client";

import { RemixesTab as RemixesTabBase } from "@medialane/ui";
import { MEDIALANE_BACKEND_URL, MEDIALANE_API_KEY } from "@/lib/constants";

const apiConfig = { baseUrl: MEDIALANE_BACKEND_URL, apiKey: MEDIALANE_API_KEY };

export function RemixesTab({ contractAddress, tokenId }: { contractAddress: string; tokenId: string }) {
  return <RemixesTabBase apiConfig={apiConfig} contractAddress={contractAddress} tokenId={tokenId} />;
}

export { ParentAttributionBanner } from "@medialane/ui";
