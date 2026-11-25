"use client";

import { use } from "react";
import { EditionMint } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function MintIP1155Page({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <EditionMint contract={contract} aside={<CreateAside kind="mintEdition" />} />;
}
