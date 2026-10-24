"use client";

import { use } from "react";
import { EditionMint } from "@medialane/ui";
import { MintEditionAside } from "@/components/claim/mint-edition-aside";

export default function MintIP1155Page({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <EditionMint contract={contract} aside={<MintEditionAside />} />;
}
