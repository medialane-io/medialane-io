"use client";

import { SponsorshipCreate } from "@medialane/ui";
import { CreateSponsorshipAside } from "@/components/claim/create-sponsorship-aside";

export default function CreateSponsorshipPage() {
  return <SponsorshipCreate aside={<CreateSponsorshipAside />} />;
}
