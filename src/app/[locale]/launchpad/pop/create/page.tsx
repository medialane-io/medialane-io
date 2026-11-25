"use client";

import { PopCreate } from "@medialane/ui";
import { CreateAside } from "@medialane/ui/create-aside";

export default function CreatePOPPage() {
  return <PopCreate aside={<CreateAside kind="pop" />} />;
}
