"use client";

import { use } from "react";
import { RemixMint } from "@medialane/ui";

export default function CreateRemixPage({ params }: { params: Promise<{ contract: string; tokenId: string }> }) {
  const { contract, tokenId } = use(params);
  return <RemixMint contract={contract} tokenId={tokenId} />;
}
