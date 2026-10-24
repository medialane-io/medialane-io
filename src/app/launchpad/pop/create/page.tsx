"use client";

import { PopCreate } from "@medialane/ui";
import { CreatePopAside } from "@/components/claim/create-pop-aside";

export default function CreatePOPPage() {
  return <PopCreate aside={<CreatePopAside />} />;
}
