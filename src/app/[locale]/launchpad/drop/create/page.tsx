"use client";

import { DropCreate } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function CreateDropPage() {
  return <DropCreate aside={<PageAside kind="drop" />} />;
}
