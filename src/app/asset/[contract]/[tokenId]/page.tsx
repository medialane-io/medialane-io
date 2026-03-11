import type { Metadata } from "next";
import { fetchTokenMeta, fetchCollectionMeta, ipfsToHttpServer } from "@/lib/api-server";
import AssetPageClient from "./asset-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ contract: string; tokenId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contract, tokenId } = await params;
  const token = await fetchTokenMeta(contract, tokenId);

  const name        = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = token?.metadata?.description ?? token?.description ?? "View this IP asset on Medialane.";
  const rawImage    = token?.metadata?.image ?? token?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;

  return {
    title: name,
    description,
    openGraph: {
      title: `${name} | Medialane`,
      description,
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: name }],
      }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: `${name} | Medialane`,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function AssetPage({ params }: Props) {
  return <AssetPageClient />;
}
