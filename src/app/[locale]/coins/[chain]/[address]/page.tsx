import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chainFromSlug } from "@/lib/routes";
import { fetchCoinMeta, ipfsToHttpServer } from "@/lib/api-server";
import { alternates, buildSocialMetadata, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
import { JsonLd } from "@medialane/ui/json-ld";
import { CoinExploreClient } from "./coin-explore-client";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

interface Props {
  params: Promise<{ chain: string; address: string; locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, address, locale } = await params;
  const coin = await fetchCoinMeta(address);

  const name        = coin?.name ?? "Creator Coin";
  const description = coin?.description ?? `Buy, hold, and trade ${name} on Medialane.`;
  const rawImage    = coin?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path        = `/coins/${chain}/${address}`;

  return {
    title: name,
    description,
    alternates: alternates(path, locale),
    ...buildSocialMetadata({ title: name, description, imageUrl }),
  };
}

export default async function CoinExplorePage({ params }: Props) {
  const { chain, address } = await params;
  if (!chainFromSlug(chain)) notFound();

  const coin = await fetchCoinMeta(address);
  const name = coin?.name ?? "Creator Coin";
  const rawImage = coin?.image;
  const imageUrl = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path = `/coins/${chain}/${address}`;

  const jsonLd = [
    buildProductJsonLd({
      name,
      path,
      description: coin?.description ?? undefined,
      image: imageUrl,
      brand: coin?.creator ?? undefined,
    }),
    buildBreadcrumbJsonLd([
      { name: "Coins", path: "/coins" },
      { name, path },
    ]),
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <CoinExploreClient address={address} />
    </>
  );
}
