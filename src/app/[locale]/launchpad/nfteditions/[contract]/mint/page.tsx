"use client";

import { use } from "react";
import { EditionMint } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function MintIP1155Page({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <EditionMint contract={contract} aside={<PageAside kind="mintEdition" />} />;
}
