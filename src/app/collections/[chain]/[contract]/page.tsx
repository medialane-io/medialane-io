import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchCollectionMeta, ipfsToHttpServer } from "@/lib/api-server";
import { absoluteUrl, canonical, truncateDescription, buildSocialMetadata, buildBreadcrumbJsonLd } from "@/lib/seo";
import { chainFromSlug } from "@/lib/routes";
import CollectionPageClient from "./collection-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ chain: string; contract: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, contract } = await params;
  const col = await fetchCollectionMeta(contract);

  const name        = col?.name ?? "Collection";
  const description = truncateDescription(
    col?.description
      ?? `Browse ${col?.totalSupply ?? ""} items in the ${name} collection on Medialane.`.trim()
  );
  const rawImage    = col?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path        = `/collections/${chain}/${contract}`;

  return {
    title: name,
    description,
    alternates: canonical(path),
    ...buildSocialMetadata({ title: name, description, imageUrl }),
  };
}

export default async function CollectionPage({ params }: Props) {
  const { chain, contract } = await params;
  if (!chainFromSlug(chain)) notFound();
  const col = await fetchCollectionMeta(contract);
  const name = col?.name ?? "Collection";
  const description = col?.description ?? `Browse ${col?.totalSupply ?? ""} items in the ${name} collection on Medialane.`.trim();
  const imageUrl = ipfsToHttpServer(col?.image ?? "");
  const path = `/collections/${chain}/${contract}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name,
      description,
      url: absoluteUrl(path),
      ...(imageUrl && { image: imageUrl }),
      mainEntity: {
        "@type": "CreativeWorkSeries",
        name,
        description,
        ...(imageUrl && { image: imageUrl }),
        ...(col?.totalSupply != null && { numberOfItems: col.totalSupply }),
      },
    },
    buildBreadcrumbJsonLd([
      { name: "Collections", path: "/collections" },
      { name, path },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <CollectionPageClient />
    </>
  );
}
