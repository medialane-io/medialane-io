import type { Metadata } from "next";
import { fetchDropMeta, ipfsToHttpServer } from "@/lib/api-server";
import { canonical, buildBreadcrumbJsonLd, buildProductJsonLd, buildSocialMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import DropDetailPage from "./drop-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ contract: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contract } = await params;
  const drop = await fetchDropMeta(contract);

  const name        = drop?.name ?? "Collection Drop";
  const description = drop?.description ?? `Claim ${name} on Medialane.`;
  const rawImage    = drop?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;

  return {
    title: name,
    description,
    alternates: canonical(`/launchpad/drop/${contract}`),
    ...buildSocialMetadata({ title: name, description, imageUrl }),
  };
}

export default async function Page({ params }: Props) {
  const { contract } = await params;
  const drop = await fetchDropMeta(contract);

  const name = drop?.name ?? "Collection Drop";
  const rawImage = drop?.image;
  const imageUrl = rawImage ? ipfsToHttpServer(rawImage) : undefined;

  const jsonLd = [
    buildProductJsonLd({
      name,
      path: `/launchpad/drop/${contract}`,
      description: drop?.description ?? undefined,
      image: imageUrl,
    }),
    buildBreadcrumbJsonLd([
      { name: "Launchpad", path: "/launchpad" },
      { name: "Collection Drop", path: "/launchpad/drop" },
      { name, path: `/launchpad/drop/${contract}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <DropDetailPage contract={contract} />
    </>
  );
}
