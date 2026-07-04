import type { Metadata } from "next";
import { fetchCollectionMeta, ipfsToHttpServer } from "@/lib/api-server";
import { canonical, buildBreadcrumbJsonLd, buildProductJsonLd, buildSocialMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import TicketsDetailPage from "./tickets-page-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ contract: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { contract } = await params;
  const col = await fetchCollectionMeta(contract);

  const name        = col?.name ?? "IP Tickets";
  const description = col?.description ?? `Buy verifiable, redeemable tickets for ${name} on Medialane.`;
  const rawImage    = col?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;

  return {
    title: name,
    description,
    alternates: canonical(`/launchpad/tickets/${contract}`),
    ...buildSocialMetadata({ title: name, description, imageUrl }),
  };
}

export default async function Page({ params }: Props) {
  const { contract } = await params;
  const col = await fetchCollectionMeta(contract);

  const name = col?.name ?? "IP Tickets";
  const rawImage = col?.image;
  const imageUrl = rawImage ? ipfsToHttpServer(rawImage) : undefined;

  const jsonLd = [
    buildProductJsonLd({
      name,
      path: `/launchpad/tickets/${contract}`,
      description: col?.description,
      image: imageUrl,
    }),
    buildBreadcrumbJsonLd([
      { name: "Launchpad", path: "/launchpad" },
      { name: "IP Tickets", path: "/launchpad/tickets" },
      { name, path: `/launchpad/tickets/${contract}` },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <TicketsDetailPage contract={contract} />
    </>
  );
}
