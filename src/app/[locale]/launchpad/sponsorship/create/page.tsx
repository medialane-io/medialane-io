"use client";

import { SponsorshipCreate } from "@medialane/ui";
import { CreateSponsorshipAside } from "@medialane/ui";

export default function CreateSponsorshipPage() {
  return <SponsorshipCreate aside={<CreateSponsorshipAside />} />;
}
