import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { IP_TYPE_DATA_MAP } from "@medialane/ui";
import { IpTypePageClient } from "./ip-type-page-client";
import { canonical } from "@/lib/seo";

interface Props {
  params: Promise<{ ipType: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ipType } = await params;
  const config = IP_TYPE_DATA_MAP[ipType];
  if (!config) return {};
  const title = `${config.label} Assets`;
  const description = `Browse all ${config.label} IP assets indexed on Medialane — Creator Launchpad + NFT Marketplace.`;
  return {
    title,
    description,
    alternates: canonical(`/${ipType}`),
    openGraph: {
      title: `${title} | Medialane`,
      description,
      url: `/${ipType}`,
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
  const config = IP_TYPE_DATA_MAP[ipType];
  if (!config) notFound();

  return <IpTypePageClient slug={ipType} />;
}
