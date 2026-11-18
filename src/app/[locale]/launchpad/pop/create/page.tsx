"use client";

import { PopCreate } from "@medialane/ui";
import { PageAside } from "@/components/claim/page-aside";

export default function CreatePOPPage() {
  return <PopCreate aside={<PageAside kind="pop" />} />;
}
