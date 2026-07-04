import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { chainFromSlug } from "@/lib/routes";
import { fetchCoinMeta, ipfsToHttpServer } from "@/lib/api-server";
import { canonical, buildSocialMetadata, buildBreadcrumbJsonLd, buildProductJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/json-ld";
import { CoinExploreClient } from "./coin-explore-client";

export const revalidate = 60;

interface Props {
  params: Promise<{ chain: string; address: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, address } = await params;
  const coin = await fetchCoinMeta(address);

  const name        = coin?.name ?? "Creator Coin";
  const description = coin?.description ?? `Buy, hold, and trade ${name} on Medialane.`;
  const rawImage    = coin?.image;
  const imageUrl    = rawImage ? ipfsToHttpServer(rawImage) : undefined;
  const path        = `/coins/${chain}/${address}`;

  return {
    title: name,
    description,
    alternates: canonical(path),
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
      description: coin?.description,
      image: imageUrl,
      brand: coin?.creator,
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
