"use client";

import { SponsorshipCreate } from "@medialane/ui";
import { PageAside } from "@medialane/ui/page-aside";

export default function CreateSponsorshipPage() {
  return <SponsorshipCreate aside={<PageAside kind="sponsorship" />} />;
}
