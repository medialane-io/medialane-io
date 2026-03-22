import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IP_TYPE_MAP } from "@/lib/ip-type-config";
import { IpTypePageClient } from "./ip-type-page-client";

interface Props {
  params: Promise<{ ipType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ipType } = await params;
  const config = IP_TYPE_MAP[ipType];
  if (!config) return {};
  return {
    title: `${config.label} Assets — Medialane`,
    description: `Browse all ${config.label} IP assets indexed on Medialane.`,
  };
}

export default async function IpTypePage({ params }: Props) {
  const { ipType } = await params;
  const config = IP_TYPE_MAP[ipType];
  if (!config) notFound();

  return <IpTypePageClient slug={ipType} />;
}
