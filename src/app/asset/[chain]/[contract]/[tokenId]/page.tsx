import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchTokenMeta, fetchCollectionMeta, ipfsToHttpServer } from "@/lib/api-server";
import { absoluteUrl, canonical, truncateDescription, buildSocialMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { chainFromSlug } from "@/lib/routes";
import AssetPageClient from "./asset-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ chain: string; contract: string; tokenId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, contract, tokenId } = await params;
  const token = await fetchTokenMeta(contract, tokenId);

  const name        = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = truncateDescription(token?.metadata?.description ?? token?.description ?? "View this digital asset on Medialane.");
  const rawImage    = token?.metadata?.image ?? token?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path        = `/asset/${chain}/${contract}/${tokenId}`;

  return {
    title: name,
    description,
    alternates: canonical(path),
    ...buildSocialMetadata({ title: name, description, imageUrl }),
  };
}

export default async function AssetPage({ params }: Props) {
  const { chain, contract, tokenId } = await params;
  if (!chainFromSlug(chain)) notFound();
  const [token, collection] = await Promise.all([
    fetchTokenMeta(contract, tokenId),
    fetchCollectionMeta(contract),
  ]);
  const name = token?.metadata?.name ?? token?.name ?? `Token #${tokenId}`;
  const description = token?.metadata?.description ?? token?.description ?? "View this digital asset on Medialane.";
  const imageUrl = ipfsToHttpServer(token?.metadata?.image ?? token?.image ?? "");
  const path = `/asset/${chain}/${contract}/${tokenId}`;
  const collectionName = collection?.name ?? "Collection";
  const collectionPath = `/collections/${chain}/${contract}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name,
      description,
      url: absoluteUrl(path),
      ...(imageUrl && { image: imageUrl }),
      identifier: `${contract}/${tokenId}`,
      isAccessibleForFree: true,
      mainEntityOfPage: absoluteUrl(path),
    },
    buildBreadcrumbJsonLd([
      { name: "Marketplace", path: "/marketplace" },
      { name: collectionName, path: collectionPath },
      { name, path },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <AssetPageClient />
    </>
  );
}
