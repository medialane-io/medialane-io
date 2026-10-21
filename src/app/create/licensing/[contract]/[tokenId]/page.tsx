"use client";

import { useParams } from "next/navigation";
import { LicenseRequestPage } from "@medialane/ui";

export default function CreateLicensingPage() {
  const { contract, tokenId } = useParams<{ contract: string; tokenId: string }>();
  return <LicenseRequestPage contract={contract} tokenId={tokenId} />;
}
