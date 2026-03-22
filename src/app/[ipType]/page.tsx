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
  const title = `${config.label} Assets`;
  const description = `Browse all ${config.label} IP assets indexed on Medialane — the Starknet creator launchpad.`;
  return {
    title,
    description,
    openGraph: {
      title: `${title} | Medialane`,
      description,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: `Medialane ${config.label} Assets` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Medialane`,
      description,
      images: ["/og-image.jpg"],
    },
  };
}

export default async function IpTypePage({ params }: Props) {
  const { ipType } = await params;
  const config = IP_TYPE_MAP[ipType];
  if (!config) notFound();

  return <IpTypePageClient slug={ipType} />;
}
