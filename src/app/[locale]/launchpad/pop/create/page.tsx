"use client";

import { PopCreate } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CreatePOPPage() {
  return <PopCreate aside={<PageAside kind="pop" />} />;
}
