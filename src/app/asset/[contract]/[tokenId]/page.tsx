import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchTokenMeta, ipfsToHttpServer } from "@/lib/api-server";
import { absoluteUrl, canonical, truncateDescription } from "@/lib/seo";
import AssetPageClient from "./asset-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ contract: string; tokenId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contract, tokenId } = await params;
  const token = await fetchTokenMeta(contract, tokenId);

  const name        = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = truncateDescription(token?.metadata?.description ?? token?.description ?? "View this IP asset on Medialane.");
  const rawImage    = token?.metadata?.image ?? token?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path        = `/asset/${contract}/${tokenId}`;

  return {
    title: name,
    description,
    alternates: canonical(path),
    openGraph: {
      title: `${name} | Medialane`,
      description,
      url: path,
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

export default async function AssetPage({ params }: Props) {
  const { contract, tokenId } = await params;
  const token = await fetchTokenMeta(contract, tokenId);
  const name = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = token?.metadata?.description ?? token?.description ?? "View this IP asset on Medialane.";
  const imageUrl = ipfsToHttpServer(token?.metadata?.image ?? token?.image ?? "");
  const path = `/asset/${contract}/${tokenId}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    description,
    url: absoluteUrl(path),
    ...(imageUrl && { image: imageUrl }),
    identifier: `${contract}/${tokenId}`,
    isAccessibleForFree: true,
    mainEntityOfPage: absoluteUrl(path),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <AssetPageClient />
    </>
  );
}
