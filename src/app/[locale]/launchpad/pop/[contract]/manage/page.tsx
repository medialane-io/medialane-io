"use client";

import { use } from "react";
import { PopManagePage } from "@medialane/ui";

export default function PopManageRoute({ params }: { params: Promise<{ contract: string }> }) {
  const { contract } = use(params);
  return <PopManagePage contract={contract} />;
}
